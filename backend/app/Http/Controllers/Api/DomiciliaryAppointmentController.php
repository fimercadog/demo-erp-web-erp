<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DomiciliaryAppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DomiciliaryAppointmentController extends Controller
{
    public function __construct(private DomiciliaryAppointmentService $domiciliaryService)
    {
    }

    /**
     * List domiciliary appointments.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = Auth::user()->company_id;
        $date = $request->query('date');
        $dispatchStatus = $request->query('dispatch_status');

        $appointments = $this->domiciliaryService->getDomiciliaryList($companyId, $date, $dispatchStatus);

        return response()->json([
            'data' => $appointments,
        ]);
    }

    /**
     * Book domiciliary appointment (Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'required|string|max:255',
            'city' => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
            'address_reference' => 'nullable|string|max:500',
            'starts_at' => 'required|date',
            'practitioner_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['company_id'] = Auth::user()->company_id;

        $appointment = $this->domiciliaryService->bookDomiciliary($validated);

        return response()->json([
            'message' => 'Cita a domicilio registrada exitosamente.',
            'data' => $appointment,
        ], 201);
    }

    /**
     * Update dispatch status (e.g. en_route, arrived, completed).
     */
    public function updateDispatch(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'dispatch_status' => 'required|string|in:pending,assigned,en_route,arrived,completed',
            'practitioner_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $appointment = $this->domiciliaryService->updateDispatchStatus(
            $id,
            $validated['dispatch_status'],
            $validated['practitioner_id'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Estado de atención a domicilio actualizado.',
            'data' => $appointment,
        ]);
    }

    /**
     * Execute IV therapy and deduct consumable stock.
     */
    public function executeTherapy(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'consumables' => 'nullable|array',
            'consumables.*.product_id' => 'required|exists:products,id',
            'consumables.*.quantity' => 'required|integer|min:1',
        ]);

        $result = $this->domiciliaryService->executeInfusionTherapy(
            $id,
            $request->input('consumables', [])
        );

        return response()->json([
            'message' => 'Sesión de sueroterapia registrada. Insumos descontados de inventario.',
            'data' => $result,
        ]);
    }
}
