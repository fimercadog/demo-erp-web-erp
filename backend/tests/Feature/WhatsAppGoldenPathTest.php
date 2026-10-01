<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Company;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Species;
use App\Models\User;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class WhatsAppGoldenPathTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $veterinarian;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['id' => 1, 'name' => 'Clínica Veterinaria Central', 'status' => 'active']);

        $role = Role::firstOrCreate(['name' => 'Veterinario/a', 'guard_name' => 'web']);
        $this->veterinarian = User::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Dr. Carlos Mendoza',
            'email' => 'carlos@veterinaria.test',
        ]);
        $this->veterinarian->assignRole($role);

        $this->service = Service::create([
            'company_id' => $this->company->id,
            'name' => 'Consulta Veterinaria General',
            'status' => 'active',
            'estimated_duration_minutes' => 30,
        ]);
    }

    public function test_webhook_verification_handshake(): void
    {
        $response = $this->get('/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=vet_secret_webhook_token&hub.challenge=TEST_CHALLENGE_99');

        $response->assertStatus(200);
        $this->assertEquals('TEST_CHALLENGE_99', $response->getContent());
    }

    public function test_webhook_idempotency_returns_200_without_reprocessing(): void
    {
        $payload = [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'messages' => [
                                    [
                                        'id' => 'wamid.HBgLMTIzNDU2Nzg5MDAVAgASMBBEM0Y1R',
                                        'from' => '573001234567',
                                        'type' => 'text',
                                        'text' => ['body' => 'Hola'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $res1 = $this->postJson('/api/webhooks/whatsapp', $payload);
        $res1->assertStatus(200);
        $this->assertEquals(1, WhatsAppMessage::where('wamid', 'wamid.HBgLMTIzNDU2Nzg5MDAVAgASMBBEM0Y1R')->count());

        // Second post with exact same wamid
        $res2 = $this->postJson('/api/webhooks/whatsapp', $payload);
        $res2->assertStatus(200);
        $this->assertEquals(1, WhatsAppMessage::where('wamid', 'wamid.HBgLMTIzNDU2Nzg5MDAVAgASMBBEM0Y1R')->count());
    }

    public function test_privacy_policy_enforcement_and_acceptance(): void
    {
        $phone = '573001112233';

        // 1. Initial message without consent -> asks for privacy acceptance
        $payload1 = $this->makePayload('wamid.1', $phone, 'Hola, necesito una cita');
        $this->postJson('/api/webhooks/whatsapp', $payload1)->assertStatus(200);

        $conv = WhatsAppConversation::where('phone_number', $phone)->first();
        $this->assertNotNull($conv);
        $this->assertFalse($conv->privacy_accepted);

        $outbound1 = WhatsAppMessage::where('phone_number', $phone)->where('direction', 'outbound')->latest('id')->first();
        $this->assertStringContainsString('política de privacidad', mb_strtolower($outbound1->content));

        // 2. Acceptance message 'ACEPTO' -> privacy_accepted = true
        $payload2 = $this->makePayload('wamid.2', $phone, 'ACEPTO');
        $this->postJson('/api/webhooks/whatsapp', $payload2)->assertStatus(200);

        $conv->refresh();
        $this->assertTrue($conv->privacy_accepted);
        $this->assertEquals('identifying_client', $conv->state);

        $outbound2 = WhatsAppMessage::where('phone_number', $phone)->where('direction', 'outbound')->latest('id')->first();
        $this->assertStringContainsString('nombre completo', $outbound2->content);
    }

    public function test_full_golden_path_appointment_booking(): void
    {
        $phone = '573009998877';

        // Step 1: Accept Privacy
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w1', $phone, 'ACEPTO'))->assertStatus(200);

        // Step 2: Provide Owner Name
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w2', $phone, 'María Fernanda Gómez'))->assertStatus(200);
        $client = Client::where('phone', $phone)->first();
        $this->assertNotNull($client);
        $this->assertEquals('María Fernanda Gómez', $client->name);

        // Step 3: Provide Pet Name
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w3', $phone, 'Rocky'))->assertStatus(200);
        $pet = Patient::where('client_id', $client->id)->first();
        $this->assertNotNull($pet);
        $this->assertEquals('Rocky', $pet->name);

        // Step 4: Select Service (Option 1)
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w4', $phone, '1'))->assertStatus(200);

        // Step 5: Provide Date (Next business day)
        $targetDate = Carbon::now()->next(Carbon::TUESDAY);
        $dateStr = $targetDate->format('Y-m-d');
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w5', $phone, $dateStr))->assertStatus(200);

        // Step 6: Select Slot (Option 1 - usually 08:00)
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w6', $phone, '1'))->assertStatus(200);

        // Assert Appointment Created in ERP Core
        $appointment = Appointment::where('patient_id', $pet->id)->first();
        $this->assertNotNull($appointment);
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertEquals($this->veterinarian->id, $appointment->practitioner_id);
        $this->assertEquals($this->service->id, $appointment->service_id);

        // Assert AuditLog Created
        $audit = AuditLog::where('entity_id', $appointment->id)->first();
        $this->assertNotNull($audit);

        // Assert WhatsApp Outbound Confirmation Message
        $outbound = WhatsAppMessage::where('phone_number', $phone)->where('direction', 'outbound')->latest('id')->first();
        $this->assertStringContainsString('Cita agendada exitosamente', $outbound->content);
        $this->assertStringContainsString('Rocky', $outbound->content);
    }

    public function test_double_booking_rejection(): void
    {
        $phone = '573007776655';

        // Pre-create appointment taking Dr. Carlos Mendoza at Tuesday 08:00
        $targetDate = Carbon::now()->next(Carbon::TUESDAY);
        $startsAt = $targetDate->copy()->setTime(8, 0);
        $endsAt = $startsAt->copy()->addMinutes(30);

        $species = Species::create(['company_id' => $this->company->id, 'name' => 'Canino', 'status' => 'active']);

        $clientDummy = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Existente',
            'email' => 'existente@test.com',
            'phone' => '573000000000',
        ]);
        $petDummy = Patient::create([
            'company_id' => $this->company->id,
            'client_id' => $clientDummy->id,
            'species_id' => $species->id,
            'name' => 'Mascota Existente',
            'status' => 'active',
        ]);

        Appointment::create([
            'company_id' => $this->company->id,
            'patient_id' => $petDummy->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->veterinarian->id,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'duration_minutes' => 30,
            'reason' => 'Existing Appointment',
            'status' => 'confirmed',
        ]);

        $clientTarget = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Objetivo',
            'email' => 'target@test.com',
            'phone' => $phone,
        ]);
        $petTarget = Patient::create([
            'company_id' => $this->company->id,
            'client_id' => $clientTarget->id,
            'species_id' => $species->id,
            'name' => 'Mascota Objetivo',
            'status' => 'active',
        ]);

        // Conversation progresses to slot selection for 08:00
        $conv = WhatsAppConversation::create([
            'company_id' => $this->company->id,
            'phone_number' => $phone,
            'privacy_accepted' => true,
            'client_id' => $clientTarget->id,
            'patient_id' => $petTarget->id,
            'state' => 'selecting_slot',
            'state_data' => [
                'service_id' => $this->service->id,
                'date' => $targetDate->format('Y-m-d'),
                'slots' => ['08:00', '08:30', '09:00'],
            ],
        ]);

        // Attempt booking 08:00 (Option 1)
        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w_double', $phone, '08:00'))->assertStatus(200);

        // Outbound response should inform slot is taken
        $outbound = WhatsAppMessage::where('phone_number', $phone)->where('direction', 'outbound')->latest('id')->first();
        $this->assertStringContainsString('ya no está disponible', $outbound->content);
    }

    public function test_audio_message_transcription_and_processing(): void
    {
        $phone = '573004443322';

        $audioPayload = [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'messages' => [
                                    [
                                        'id' => 'wamid.audio123',
                                        'from' => $phone,
                                        'type' => 'audio',
                                        'audio' => [
                                            'id' => 'media_audio_99',
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->postJson('/api/webhooks/whatsapp', $audioPayload)->assertStatus(200);

        $msg = WhatsAppMessage::where('wamid', 'wamid.audio123')->first();
        $this->assertNotNull($msg);
        $this->assertEquals('audio', $msg->type);
        $this->assertNotEmpty($msg->content);
    }

    public function test_human_handover_intent(): void
    {
        $phone = '573008881122';

        WhatsAppConversation::create([
            'company_id' => $this->company->id,
            'phone_number' => $phone,
            'privacy_accepted' => true,
            'state' => 'greeting',
        ]);

        $this->postJson('/api/webhooks/whatsapp', $this->makePayload('w_handover', $phone, 'Quiero hablar con una persona'))->assertStatus(200);

        $conv = WhatsAppConversation::where('phone_number', $phone)->first();
        $this->assertEquals('human_handover', $conv->state);

        $outbound = WhatsAppMessage::where('phone_number', $phone)->where('direction', 'outbound')->latest('id')->first();
        $this->assertStringContainsString('asesor humano', $outbound->content);
    }

    private function makePayload(string $wamid, string $from, string $body): array
    {
        return [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'messages' => [
                                    [
                                        'id' => $wamid,
                                        'from' => $from,
                                        'type' => 'text',
                                        'text' => [
                                            'body' => $body,
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
