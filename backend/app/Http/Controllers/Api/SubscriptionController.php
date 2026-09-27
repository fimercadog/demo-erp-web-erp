<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\AuditService;
use App\Services\SubscriptionService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends BaseCrudController
{
    protected string $model = Subscription::class;

    protected string $resource = SubscriptionResource::class;

    protected array $searchable = ['subscription_number', 'notes'];

    protected array $filterable = ['status' => 'status', 'client_id' => 'client_id', 'subscription_plan_id' => 'subscription_plan_id'];

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $query = Subscription::with(['plan', 'client', 'branch'])->where('company_id', $companyId);

        $tables->apply($request, $query, $this->searchable, $this->filterable);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->orderBy('id', 'desc')->paginate($perPage);

        return SubscriptionResource::collection($records);
    }

    public function store(Request $request, AuditService $audit)
    {
        $service = app(SubscriptionService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'client_id' => ['required', 'exists:clients,id'],
            'subscription_plan_id' => ['required', 'exists:subscription_plans,id'],
            'subscription_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:active,paused,cancelled,expired'],
            'start_date' => ['required', 'date'],
            'next_billing_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'auto_renew' => ['nullable', 'boolean'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['company_id'] = $companyId;
        $data = array_filter($data, fn ($value) => !is_null($value));
        $subscription = $service->createSubscription($data);
        $audit->record('subscription.created', $subscription, $request);

        return (new SubscriptionResource($subscription->load(['plan', 'client', 'branch'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, $id)
    {
        $companyId = $this->companyId($request);
        $subscription = Subscription::with(['plan', 'client', 'branch', 'invoices'])
            ->where('company_id', $companyId)
            ->findOrFail($id);

        return new SubscriptionResource($subscription);
    }

    public function update(Request $request, $id, AuditService $audit)
    {
        $service = app(SubscriptionService::class);
        $companyId = $this->companyId($request);
        $subscription = Subscription::where('company_id', $companyId)->findOrFail($id);

        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'client_id' => ['sometimes', 'required', 'exists:clients,id'],
            'subscription_plan_id' => ['sometimes', 'required', 'exists:subscription_plans,id'],
            'status' => ['nullable', 'string', 'in:active,paused,cancelled,expired'],
            'start_date' => ['sometimes', 'required', 'date'],
            'next_billing_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'auto_renew' => ['nullable', 'boolean'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = $service->updateSubscription($subscription, $data);
        $audit->record('subscription.updated', $updated, $request);

        return new SubscriptionResource($updated->load(['plan', 'client', 'branch']));
    }

    public function pause(Request $request, $id, SubscriptionService $service, AuditService $audit): JsonResponse
    {
        $companyId = $this->companyId($request);
        $subscription = Subscription::where('company_id', $companyId)->findOrFail($id);

        $updated = $service->pauseSubscription($subscription);
        $audit->record('subscription.paused', $updated, $request);

        return response()->json([
            'message' => 'Suscripción pausada correctamente.',
            'data' => new SubscriptionResource($updated),
        ]);
    }

    public function resume(Request $request, $id, SubscriptionService $service, AuditService $audit): JsonResponse
    {
        $companyId = $this->companyId($request);
        $subscription = Subscription::where('company_id', $companyId)->findOrFail($id);

        $updated = $service->resumeSubscription($subscription);
        $audit->record('subscription.resumed', $updated, $request);

        return response()->json([
            'message' => 'Suscripción reanudada correctamente.',
            'data' => new SubscriptionResource($updated),
        ]);
    }

    public function cancel(Request $request, $id, SubscriptionService $service, AuditService $audit): JsonResponse
    {
        $companyId = $this->companyId($request);
        $subscription = Subscription::where('company_id', $companyId)->findOrFail($id);

        $updated = $service->cancelSubscription($subscription);
        $audit->record('subscription.cancelled', $updated, $request);

        return response()->json([
            'message' => 'Suscripción cancelada correctamente.',
            'data' => new SubscriptionResource($updated),
        ]);
    }

    public function processBilling(Request $request, SubscriptionService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $asOfDate = $request->input('as_of_date');

        $processed = $service->processDueSubscriptions($companyId, $asOfDate);

        return response()->json([
            'message' => 'Procesamiento de facturación recurrente completado.',
            'count' => count($processed),
            'processed' => $processed,
        ]);
    }
}
