<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ConsultationItemResource;
use App\Http\Resources\ConsultationResource;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Services\AuditService;
use App\Services\TableQueryService;
use App\Services\VeterinaryConsultationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ConsultationController extends BaseCrudController
{
    protected string $model = Consultation::class;

    protected string $resource = ConsultationResource::class;

    protected array $with = [
        'patient.client', 'patient.species', 'patient.breed', 'vet', 'diagnoses',
        'items.product', 'service', 'invoice.accountReceivable', 'warehouse',
    ];

    protected array $searchable = ['reason'];

    protected array $filterable = ['patient_id' => 'patient_id', 'vet_id' => 'vet_id', 'status' => 'status'];

    /** Historia clínica: más reciente primero. */
    public function index(Request $request, TableQueryService $tables)
    {
        $request->merge([
            'date_field' => 'date',
            'sort' => $request->input('sort', 'date'),
            'direction' => $request->input('direction', 'desc'),
        ]);

        return parent::index($request, $tables);
    }

    /** Al crear una consulta desde una cita, la cita pasa a "attended". */
    public function store(Request $request, AuditService $audit)
    {
        return DB::transaction(function () use ($request, $audit) {
            $response = parent::store($request, $audit);
            $id = (int) $response->getData(true)['data']['id'];

            $this->syncDiagnoses($request, $id);

            $appointmentId = $request->input('appointment_id');
            if ($appointmentId) {
                $appointment = Appointment::query()
                    ->where('company_id', $this->companyId($request))
                    ->find($appointmentId);

                if ($appointment && in_array($appointment->status, ['scheduled', 'confirmed'], true)) {
                    $old = $appointment->getOriginal();
                    $appointment->update(['status' => 'attended']);
                    $audit->record('updated', $appointment, $request, $old);
                }
            }

            $model = Consultation::query()
                ->where('company_id', $this->companyId($request))
                ->with($this->with)
                ->findOrFail($id);

            return (new ConsultationResource($model))->response()->setStatusCode(201);
        });
    }

    public function update(Request $request, string $id, AuditService $audit)
    {
        return DB::transaction(function () use ($request, $id, $audit) {
            $consultation = Consultation::query()
                ->where('company_id', $this->companyId($request))
                ->findOrFail($id);

            abort_if(in_array($consultation->status, ['completed', 'cancelled'], true), 422, 'No se puede editar una consulta clínica finalizada o cancelada.');

            $response = parent::update($request, $id, $audit);

            if ($response instanceof Response && $response->getStatusCode() >= 300) {
                return $response;
            }

            $this->syncDiagnoses($request, (int) $id);

            return $this->show($request, $id);
        });
    }

    public function destroy(Request $request, string $id, AuditService $audit)
    {
        $consultation = Consultation::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        abort_if(
            in_array($consultation->status, ['completed', 'cancelled'], true),
            422,
            'No se puede eliminar una consulta clínica finalizada o cancelada. El historial clínico es inmutable.'
        );

        return parent::destroy($request, $id, $audit);
    }

    public function addItem(Request $request, string $id, VeterinaryConsultationService $service, AuditService $audit)
    {
        $consultation = Consultation::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        $item = $service->addItem($consultation, $request->all(), $this->companyId($request));
        $audit->record('created', $item, $request);

        return (new ConsultationItemResource($item->load('product', 'service', 'procedure')))
            ->response()
            ->setStatusCode(201);
    }

    public function removeItem(Request $request, string $id, string $itemId, VeterinaryConsultationService $service, AuditService $audit)
    {
        $consultation = Consultation::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        $service->removeItem($consultation, (int) $itemId);

        return response()->json(['message' => 'Item eliminado correctamente.']);
    }

    public function finalize(Request $request, string $id, VeterinaryConsultationService $service, AuditService $audit)
    {
        $consultation = Consultation::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        if (! empty($request->input('payment'))) {
            abort_unless(
                $request->user()->hasAnyPermission(['payments.manage', 'cash.manage']),
                403,
                'No tiene permisos para registrar cobros o pagos directos en caja.'
            );
        }

        $result = $service->finalize($consultation, $request->all(), $request->user()->id);
        $audit->record('updated', $result, $request);

        return new ConsultationResource($result);
    }

    private function syncDiagnoses(Request $request, int $consultationId): void
    {
        if (! $request->has('diagnosis_ids')) {
            return;
        }

        Consultation::query()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($consultationId)
            ->diagnoses()
            ->sync(array_map('intval', (array) $request->input('diagnosis_ids', [])));
    }

    public function restore(Request $request, string $id, AuditService $audit)
    {
        $consultation = Consultation::onlyTrashed()
            ->where('company_id', $this->companyId($request))
            ->findOrFail($id);

        $consultation->restore();
        $audit->record('restored', $consultation, $request);

        return new ConsultationResource($consultation->load($this->with));
    }
}
