<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicAppointmentBookingRequest;
use App\Http\Resources\PublicServiceResource;
use App\Models\Appointment;
use App\Models\Breed;
use App\Models\Client;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Species;
use App\Services\AuditService;
use App\Services\SchedulingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Portal publico "Agendar cita" (S13): disponibilidad real + cita
 * auto-confirmada. Complementa (no reemplaza) `PublicAppointmentController`,
 * que sigue generando un Lead para quien prefiere "solicitá y te llamamos".
 * Sin auth (throttle en las rutas). Cálculo de huecos y anti-doble-booking en
 * `SchedulingService` (compartido con el reagendado del portal del dueño, S14).
 */
class PublicSchedulingController extends Controller
{
    use ResolvesCompany;

    public function __construct(private readonly SchedulingService $scheduling) {}

    public function services(Request $request)
    {
        $services = Service::query()
            ->where('company_id', $this->companyId($request))
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return PublicServiceResource::collection($services);
    }

    public function species(Request $request)
    {
        return Species::query()
            ->where('company_id', $this->companyId($request))
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function breeds(Request $request, int $speciesId)
    {
        return Breed::query()
            ->where('company_id', $this->companyId($request))
            ->where('species_id', $speciesId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function availability(Request $request)
    {
        $companyId = $this->companyId($request);
        $request->validate([
            'service_id' => ['required', 'integer'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $service = Service::query()
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->find($request->integer('service_id'));

        abort_unless($service !== null, 422, 'El servicio seleccionado no está disponible.');

        $date = Carbon::createFromFormat('Y-m-d', (string) $request->string('date'))->startOfDay();

        return response()->json([
            'date' => $date->toDateString(),
            'slots' => $this->scheduling->freeSlots($companyId, $service, $date),
        ]);
    }

    public function book(StorePublicAppointmentBookingRequest $request, AuditService $audit)
    {
        $companyId = $this->companyId($request);
        $data = $request->validated();

        // Honeypot: descarte silencioso, sin dar señal al bot.
        if (! empty($data['company_website'])) {
            return response()->json(['message' => 'Tu cita fue agendada.'], 201);
        }

        $service = Service::query()->where('company_id', $companyId)->where('status', 'active')->find($data['service_id']);
        abort_unless($service !== null, 422, 'El servicio seleccionado ya no está disponible.');

        $species = Species::query()->where('company_id', $companyId)->where('status', 'active')->find($data['species_id']);
        abort_unless($species !== null, 422, 'La especie seleccionada no es válida.');

        $breed = null;
        if (! empty($data['breed_id'])) {
            $breed = Breed::query()->where('company_id', $companyId)->where('species_id', $species->id)->find($data['breed_id']);
            abort_unless($breed !== null, 422, 'La raza seleccionada no es válida.');
        }

        $config = config('scheduling');
        $duration = $service->estimated_duration_minutes ?: $config['default_duration_minutes'];
        $startsAt = Carbon::createFromFormat('Y-m-d H:i', $data['date'].' '.$data['start_time'], 'America/Bogota');
        $endsAt = $startsAt->copy()->addMinutes($duration);

        $this->scheduling->assertWithinBusinessWindow($startsAt, $endsAt);

        // Cliente: get-or-create FUERA de la transacción de la cita (mismo
        // motivo que PublicCatalogController::storeQuoteRequest: la relectura
        // de firstOrCreate quedaría atrapada en el snapshot REPEATABLE READ de
        // MySQL/MariaDB si corriera dentro).
        $client = Client::firstOrCreate(
            ['company_id' => $companyId, 'email' => $data['email']],
            ['name' => $data['name'], 'phone' => $data['phone'] ?? null, 'status' => 'inactive'],
        );

        $appointment = DB::transaction(function () use ($companyId, $client, $service, $species, $breed, $data, $startsAt, $endsAt, $duration) {
            $patient = Patient::firstOrCreate(
                ['company_id' => $companyId, 'client_id' => $client->id, 'name' => $data['pet_name']],
                ['species_id' => $species->id, 'breed_id' => $breed?->id, 'status' => 'active'],
            );

            $practitioner = $this->scheduling->firstFreePractitioner($companyId, $startsAt, $endsAt);
            // 409, no 500: dos visitantes pudieron elegir el mismo horario a
            // la vez: el `lockForUpdate` de firstFreePractitioner evita que
            // ambos reserven el mismo veterinario, pero el segundo en llegar
            // tiene que reintentar con otro horario, no romper.
            abort_if($practitioner === null, 409, 'Ese horario ya no está disponible. Elegí otro.');

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
                'notes' => 'Agendada desde el portal público. Contacto: '.$data['name'].
                    (! empty($data['phone']) ? ' · Tel: '.$data['phone'] : ''),
            ]);
        });

        $audit->record('created', $appointment, $request);

        return response()->json([
            'message' => 'Tu cita fue agendada.',
            'appointment' => [
                'starts_at' => $appointment->starts_at->toIso8601String(),
                'ends_at' => $appointment->ends_at->toIso8601String(),
                'service' => $service->name,
                'practitioner' => $appointment->practitioner?->name,
            ],
        ], 201);
    }
}
