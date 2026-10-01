<?php

namespace App\Services\WhatsApp;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Species;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Services\AuditService;
use App\Services\SchedulingService;
use App\Services\WhatsApp\Contracts\IntentResolverInterface;
use App\Services\WhatsApp\Contracts\WhatsAppMediaAdapterInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WhatsAppAgentService
{
    public function __construct(
        private readonly SchedulingService $scheduling,
        private readonly AuditService $audit,
        private readonly WhatsAppNotificationService $notification,
        private readonly IntentResolverInterface $intentResolver,
        private readonly WhatsAppMediaAdapterInterface $mediaAdapter,
    ) {}

    public function processIncomingPayload(array $payload, Request $request): bool
    {
        $entry = $payload['entry'][0]['changes'][0]['value'] ?? null;
        if (! $entry || empty($entry['messages'][0])) {
            return true;
        }

        $msgData = $entry['messages'][0];
        $wamid = $msgData['id'] ?? null;
        $fromPhone = $msgData['from'] ?? null;
        $type = $msgData['type'] ?? 'text';

        if (! $wamid || ! $fromPhone) {
            return true;
        }

        $companyId = 1; // Default company for single-tenant / primary vertical company

        // 1. Idempotency Check
        $existing = WhatsAppMessage::where('wamid', $wamid)->first();
        if ($existing) {
            return true;
        }

        // Extract message content
        $text = '';
        if ($type === 'text') {
            $text = $msgData['text']['body'] ?? '';
        } elseif ($type === 'audio') {
            $mediaId = $msgData['audio']['id'] ?? '';
            $text = $this->mediaAdapter->transcribeAudio($mediaId);
        } elseif ($type === 'interactive') {
            $text = $msgData['interactive']['button_reply']['title']
                ?? $msgData['interactive']['list_reply']['title']
                ?? '';
        }

        // Save incoming message log
        WhatsAppMessage::create([
            'company_id' => $companyId,
            'wamid' => $wamid,
            'phone_number' => $fromPhone,
            'direction' => 'inbound',
            'type' => $type,
            'content' => $text,
            'metadata' => $msgData,
        ]);

        // 2. Get or Create Conversation State
        $conversation = WhatsAppConversation::firstOrCreate(
            ['company_id' => $companyId, 'phone_number' => $fromPhone],
            ['state' => 'greeting', 'privacy_accepted' => false, 'last_activity_at' => now()]
        );

        $conversation->update(['last_activity_at' => now()]);

        // Resolve Intent
        $analysis = $this->intentResolver->resolve($text, $conversation);
        $intent = $analysis['intent'];

        // 3. Privacy Policy Enforcement Check
        if (! $conversation->privacy_accepted) {
            if ($intent === 'accept_privacy') {
                $conversation->update(['privacy_accepted' => true, 'state' => 'identifying_client']);
                $this->notification->sendTextMessage(
                    $companyId,
                    $fromPhone,
                    "¡Gracias por aceptar nuestra Política de Privacidad! 🐾\n\nPara comenzar, por favor indícanos tu nombre completo:"
                );
                return true;
            }

            $privacyUrl = config('services.whatsapp.privacy_policy_url', 'https://veterinaria.example.com/politica-privacidad');
            $this->notification->sendTextMessage(
                $companyId,
                $fromPhone,
                "Bienvenido a la Clínica Veterinaria. 🐶🐱\n\nPara poder ofrecerte atención y agendar tus citas, requerimos tu consentimiento.\nPuedes consultar nuestra política de privacidad aquí: {$privacyUrl}\n\nResponde 'ACEPTO' para continuar."
            );
            return true;
        }

        // 4. Human Handover Intent Check
        if ($intent === 'human_handover') {
            $conversation->update(['state' => 'human_handover']);
            $this->notification->sendTextMessage(
                $companyId,
                $fromPhone,
                "Te estamos transfiriendo con un asesor humano de nuestra clínica veterianria. En un momento un miembro de nuestro equipo te atenderá."
            );
            return true;
        }

        // 5. State Machine Handler
        return $this->handleStateFlow($conversation, $companyId, $fromPhone, $text, $intent, $analysis, $request);
    }

    private function handleStateFlow(
        WhatsAppConversation $conversation,
        int $companyId,
        string $fromPhone,
        string $text,
        string $intent,
        array $analysis,
        Request $request
    ): bool {
        $state = $conversation->state;

        // Auto link client by phone number if not linked
        if (! $conversation->client_id) {
            $client = Client::where('company_id', $companyId)->where('phone', $fromPhone)->first();
            if ($client) {
                $conversation->update(['client_id' => $client->id]);
            }
        }

        switch ($state) {
            case 'greeting':
            case 'identifying_client':
                if (! $conversation->client_id) {
                    if ($intent === 'greeting' || $intent === 'book_appointment' || empty($text)) {
                        $conversation->update(['state' => 'identifying_client']);
                        $this->notification->sendTextMessage(
                            $companyId,
                            $fromPhone,
                            "¡Hola! Bienvenido a la Clínica Veterinaria. Por favor dinos tu nombre completo para identificarte:"
                        );
                        return true;
                    }

                    // Treat input as Client Name
                    $clientName = trim($text);
                    $client = Client::firstOrCreate(
                        ['company_id' => $companyId, 'phone' => $fromPhone],
                        ['name' => $clientName, 'email' => "wa_{$fromPhone}@client.local", 'status' => 'active']
                    );
                    $conversation->update(['client_id' => $client->id, 'state' => 'identifying_pet']);
                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "¡Gracias, {$client->name}! 🐾\n¿Cuál es el nombre de tu mascota?"
                    );
                    return true;
                }

                $conversation->update(['state' => 'identifying_pet']);
                // Pass down to pet identification

            case 'identifying_pet':
                if (! $conversation->patient_id) {
                    $client = Client::find($conversation->client_id);
                    $existingPet = Patient::where('company_id', $companyId)->where('client_id', $client->id)->first();

                    if ($intent === 'greeting' && $existingPet) {
                        $conversation->update(['patient_id' => $existingPet->id, 'state' => 'selecting_service']);
                        return $this->presentServicesMenu($conversation, $companyId, $fromPhone, $existingPet->name);
                    }

                    if (! empty($text) && $intent !== 'greeting' && $intent !== 'book_appointment') {
                        $species = Species::where('company_id', $companyId)->first()
                            ?? Species::create(['company_id' => $companyId, 'name' => 'Canino', 'status' => 'active']);

                        $patient = Patient::firstOrCreate(
                            ['company_id' => $companyId, 'client_id' => $client->id, 'name' => trim($text)],
                            ['species_id' => $species->id, 'status' => 'active']
                        );

                        $conversation->update(['patient_id' => $patient->id, 'state' => 'selecting_service']);
                        return $this->presentServicesMenu($conversation, $companyId, $fromPhone, $patient->name);
                    }

                    if ($existingPet) {
                        $conversation->update(['patient_id' => $existingPet->id, 'state' => 'selecting_service']);
                        return $this->presentServicesMenu($conversation, $companyId, $fromPhone, $existingPet->name);
                    }

                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "Por favor dinos el nombre de tu mascota para continuar:"
                    );
                    return true;
                }

                $conversation->update(['state' => 'selecting_service']);
                // Fallthrough to selecting_service

            case 'selecting_service':
                $services = Service::where('company_id', $companyId)->where('status', 'active')->get();
                if ($services->isEmpty()) {
                    $this->notification->sendTextMessage($companyId, $fromPhone, "Lo sentimos, no hay servicios activos disponibles en este momento.");
                    return true;
                }

                $selectedIndex = null;
                if ($intent === 'select_option' && isset($analysis['entities']['option_index'])) {
                    $selectedIndex = $analysis['entities']['option_index'] - 1;
                } else {
                    // Try to match text index
                    if (is_numeric(trim($text))) {
                        $selectedIndex = ((int) trim($text)) - 1;
                    }
                }

                if ($selectedIndex !== null && isset($services[$selectedIndex])) {
                    $selectedService = $services[$selectedIndex];
                    $stateData = $conversation->state_data ?? [];
                    $stateData['service_id'] = $selectedService->id;
                    $conversation->update(['state' => 'selecting_date', 'state_data' => $stateData]);

                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "Has seleccionado: *{$selectedService->name}*.\n\n¿Para qué fecha deseas agendar la cita?\n(Ejemplos: 'mañana', 'hoy', o una fecha como '2026-09-26')"
                    );
                    return true;
                }

                $patient = Patient::find($conversation->patient_id);
                return $this->presentServicesMenu($conversation, $companyId, $fromPhone, $patient?->name ?? 'tu mascota');

            case 'selecting_date':
                $stateData = $conversation->state_data ?? [];
                $serviceId = $stateData['service_id'] ?? null;
                $service = Service::where('company_id', $companyId)->find($serviceId);

                if (! $service) {
                    $conversation->update(['state' => 'selecting_service']);
                    return $this->presentServicesMenu($conversation, $companyId, $fromPhone, 'tu mascota');
                }

                $normalizedText = mb_strtolower(trim($text));
                $targetDate = null;
                if (in_array($normalizedText, ['mañana', 'manana'], true)) {
                    $targetDate = Carbon::tomorrow();
                } elseif (in_array($normalizedText, ['hoy'], true)) {
                    $targetDate = Carbon::today();
                } else {
                    try {
                        $targetDate = Carbon::parse($text)->startOfDay();
                    } catch (\Throwable $e) {
                        $targetDate = null;
                    }
                }

                if (! $targetDate) {
                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "No pudimos entender la fecha. Por favor escribe una fecha válida como 'mañana' o en formato 'AAAA-MM-DD'."
                    );
                    return true;
                }

                $slots = $this->scheduling->freeSlots($companyId, $service, $targetDate);
                if (empty($slots)) {
                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "No hay horarios disponibles para el {$targetDate->format('Y-m-d')}.\nPor favor indícanos otra fecha."
                    );
                    return true;
                }

                $stateData['date'] = $targetDate->format('Y-m-d');
                $stateData['slots'] = array_values($slots);
                $conversation->update(['state' => 'selecting_slot', 'state_data' => $stateData]);

                $slotsMenu = "Horarios disponibles para el *{$targetDate->format('Y-m-d')}*:\n\n";
                foreach ($slots as $idx => $slot) {
                    $num = $idx + 1;
                    $slotsMenu .= "{$num}. {$slot}\n";
                }
                $slotsMenu .= "\nResponde con el número u horario deseado (ej. '1' o '{$slots[0]}'):";

                $this->notification->sendTextMessage($companyId, $fromPhone, $slotsMenu);
                return true;

            case 'selecting_slot':
                $stateData = $conversation->state_data ?? [];
                $serviceId = $stateData['service_id'] ?? null;
                $dateStr = $stateData['date'] ?? null;
                $slots = $stateData['slots'] ?? [];

                $service = Service::where('company_id', $companyId)->find($serviceId);
                if (! $service || ! $dateStr || empty($slots)) {
                    $conversation->update(['state' => 'selecting_service']);
                    return $this->presentServicesMenu($conversation, $companyId, $fromPhone, 'tu mascota');
                }

                $chosenTime = null;
                if (is_numeric(trim($text))) {
                    $slotIdx = ((int) trim($text)) - 1;
                    if (isset($slots[$slotIdx])) {
                        $chosenTime = $slots[$slotIdx];
                    }
                } else {
                    $timeCandidate = sprintf('%05s', trim($text));
                    if (in_array($timeCandidate, $slots, true)) {
                        $chosenTime = $timeCandidate;
                    }
                }

                if (! $chosenTime) {
                    $this->notification->sendTextMessage(
                        $companyId,
                        $fromPhone,
                        "Selección inválida. Por favor responde con un número de la lista (ej. 1, 2) o el horario exacto (ej. 09:00)."
                    );
                    return true;
                }

                $config = config('scheduling');
                $duration = $service->estimated_duration_minutes ?: ($config['default_duration_minutes'] ?? 30);
                $startsAt = Carbon::createFromFormat('Y-m-d H:i', "{$dateStr} {$chosenTime}");
                $endsAt = $startsAt->copy()->addMinutes($duration);

                try {
                    $this->scheduling->assertWithinBusinessWindow($startsAt, $endsAt);
                } catch (\Throwable $e) {
                    $this->notification->sendTextMessage($companyId, $fromPhone, "El horario seleccionado no cumple las ventanas de atención de la clínica. Por favor elige otro.");
                    return true;
                }

                $patient = Patient::find($conversation->patient_id);
                $client = Client::find($conversation->client_id);

                try {
                    $appointment = DB::transaction(function () use ($companyId, $patient, $service, $startsAt, $endsAt, $duration, $fromPhone, $client) {
                        $practitioner = $this->scheduling->firstFreePractitioner($companyId, $startsAt, $endsAt);
                        if (! $practitioner) {
                            return null;
                        }

                        return Appointment::create([
                            'company_id' => $companyId,
                            'patient_id' => $patient->id,
                            'service_id' => $service->id,
                            'practitioner_id' => $practitioner->id,
                            'starts_at' => $startsAt,
                            'ends_at' => $endsAt,
                            'duration_minutes' => $duration,
                            'reason' => $service->name,
                            'status' => 'confirmed',
                            'notes' => 'Agendada vía WhatsApp. Contacto: '.($client->name ?? 'WhatsApp').' · Tel: '.$fromPhone,
                        ]);
                    });

                    if (! $appointment) {
                        $this->notification->sendTextMessage($companyId, $fromPhone, "Ese horario ya no está disponible. Por favor elige otro horario.");
                        return true;
                    }

                    // Record Audit Log
                    $this->audit->record('created', $appointment, $request);

                    // Reset conversation state
                    $conversation->update(['state' => 'greeting', 'state_data' => null]);

                    $practitionerName = $appointment->practitioner?->name ?? 'Veterinario de turno';
                    $confirmationText = "¡Cita agendada exitosamente! 🐾✨\n\n"
                        ."📋 *Resumen de la reserva:*\n"
                        ."• 🐶 Mascota: *{$patient->name}*\n"
                        ."• 🩺 Servicio: *{$service->name}*\n"
                        ."• 📅 Fecha: *{$startsAt->format('Y-m-d')}*\n"
                        ."• ⏰ Hora: *{$startsAt->format('H:i')}*\n"
                        ."• 👨‍⚕️ Atendido por: *{$practitionerName}*\n\n"
                        ."¡Te esperamos en nuestra clínica veterianria!";

                    $this->notification->sendTextMessage($companyId, $fromPhone, $confirmationText);
                    return true;

                } catch (\Throwable $e) {
                    $this->notification->sendTextMessage($companyId, $fromPhone, "Ocurrió un error al agendar la cita. Por favor intenta nuevamente.");
                    return true;
                }

            default:
                $conversation->update(['state' => 'greeting']);
                $this->notification->sendTextMessage($companyId, $fromPhone, "¡Hola! ¿En qué podemos ayudarte hoy?");
                return true;
        }
    }

    private function presentServicesMenu(WhatsAppConversation $conversation, int $companyId, string $fromPhone, ?string $petName): bool
    {
        $services = Service::where('company_id', $companyId)->where('status', 'active')->get();
        if ($services->isEmpty()) {
            $this->notification->sendTextMessage($companyId, $fromPhone, "Actualmente no contamos con servicios activos para agendar.");
            return true;
        }

        $menu = "¿Qué servicio necesitas para *{$petName}*?\n\n";
        foreach ($services as $idx => $service) {
            $num = $idx + 1;
            $menu .= "{$num}. {$service->name}\n";
        }
        $menu .= "\nResponde con el número del servicio deseado:";

        $this->notification->sendTextMessage($companyId, $fromPhone, $menu);
        return true;
    }
}
