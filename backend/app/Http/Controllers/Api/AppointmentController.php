<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\AuditService;
use App\Services\SchedulingService;
use App\Services\TableQueryService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends BaseCrudController
{
    protected string $model = Appointment::class;

    protected string $resource = AppointmentResource::class;

    protected array $with = ['branch', 'client', 'patient.client', 'patient.species', 'service', 'practitioner'];

    protected array $searchable = ['reason', 'resource', 'notes'];

    protected array $filterable = [
        'status' => 'status',
        'practitioner_id' => 'practitioner_id',
        'patient_id' => 'patient_id',
        'client_id' => 'client_id',
        'branch_id' => 'branch_id',
    ];

    /** La agenda se filtra y ordena por `starts_at`, no por `created_at`. */
    public function index(Request $request, TableQueryService $tables)
    {
        $request->merge([
            'date_field' => 'starts_at',
            'sort' => $request->input('sort', 'starts_at'),
            'direction' => $request->input('direction', 'asc'),
        ]);

        return parent::index($request, $tables);
    }

    public function availability(Request $request, AppointmentService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $request->validate([
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'practitioner_id' => ['nullable', 'exists:users,id'],
            'resource' => ['nullable', 'string'],
        ]);

        $startsAt = Carbon::parse($request->input('starts_at'));
        $endsAt = Carbon::parse($request->input('ends_at'));
        $practitionerId = $request->input('practitioner_id') ? (int) $request->input('practitioner_id') : null;
        $resource = $request->input('resource');

        $isAvailable = $service->checkAvailability($companyId, $startsAt, $endsAt, $practitionerId, $resource);

        return response()->json([
            'available' => $isAvailable,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $endsAt->toDateTimeString(),
        ]);
    }

    public function reschedule(Request $request, string $id, AppointmentService $service, AuditService $audit)
    {
        $companyId = $this->companyId($request);
        $appointment = Appointment::where('company_id', $companyId)->findOrFail($id);

        $request->validate([
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ]);

        $newStartsAt = Carbon::parse($request->input('starts_at'));
        $newEndsAt = $request->input('ends_at') ? Carbon::parse($request->input('ends_at')) : null;

        $updated = $service->rescheduleAppointment($appointment, $newStartsAt, $newEndsAt);

        return new AppointmentResource($updated->load($this->with));
    }

    public function confirm(Request $request, string $id, AuditService $audit)
    {
        return $this->transition($request, $id, $audit, from: ['scheduled'], to: 'confirmed');
    }

    public function cancel(Request $request, string $id, AppointmentService $service, AuditService $audit)
    {
        $companyId = $this->companyId($request);
        $appointment = Appointment::where('company_id', $companyId)->findOrFail($id);

        abort_unless(
            in_array($appointment->status, ['scheduled', 'confirmed'], true),
            422,
            "No se puede pasar una cita en estado '{$appointment->status}' a 'cancelled'."
        );

        $reason = $request->input('cancellation_reason') ?? $request->input('reason');
        $cancelled = $service->cancelAppointment($appointment, $reason);

        return new AppointmentResource($cancelled->load($this->with));
    }

    public function markAttended(Request $request, string $id, AppointmentService $service, AuditService $audit)
    {
        $companyId = $this->companyId($request);
        $appointment = Appointment::where('company_id', $companyId)->findOrFail($id);

        abort_unless(
            in_array($appointment->status, ['scheduled', 'confirmed'], true),
            422,
            "No se puede pasar una cita en estado '{$appointment->status}' a 'attended'."
        );

        $autoBill = $request->boolean('auto_bill', false);
        $attended = $service->markAttended($appointment, $autoBill);

        return new AppointmentResource($attended->load($this->with));
    }

    public function markNoShow(Request $request, string $id, AuditService $audit)
    {
        return $this->transition($request, $id, $audit, from: ['scheduled', 'confirmed'], to: 'no_show');
    }

    /**
     * @param  list<string>  $from
     */
    private function transition(Request $request, string $id, AuditService $audit, array $from, string $to)
    {
        $appointment = Appointment::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        abort_unless(
            in_array($appointment->status, $from, true),
            422,
            "No se puede pasar una cita en estado '{$appointment->status}' a '{$to}'.",
        );

        $old = $appointment->getOriginal();
        $appointment->update(['status' => $to]);
        $audit->record('updated', $appointment, $request, $old);

        return new AppointmentResource($appointment->load($this->with));
    }
}
