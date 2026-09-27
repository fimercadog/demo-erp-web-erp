<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Services\AuditService;
use App\Services\SubscriptionService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionPlanController extends BaseCrudController
{
    protected string $model = SubscriptionPlan::class;

    protected string $resource = SubscriptionPlanResource::class;

    protected array $searchable = ['name', 'code', 'description'];

    protected array $filterable = ['status' => 'status', 'billing_frequency' => 'billing_frequency'];

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $query = SubscriptionPlan::query()->where('company_id', $companyId);

        $tables->apply($request, $query, $this->searchable, $this->filterable);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->orderBy('name', 'asc')->paginate($perPage);

        return SubscriptionPlanResource::collection($records);
    }

    public function store(Request $request, AuditService $audit)
    {
        $service = app(SubscriptionService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_frequency' => ['required', 'string', 'in:monthly,bimonthly,quarterly,semi_annual,annual'],
            'grace_days' => ['nullable', 'integer', 'min:0'],
            'auto_renew' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $data['company_id'] = $companyId;
        $plan = $service->createPlan($data);
        $audit->record('subscription_plan.created', $plan, $request);

        return (new SubscriptionPlanResource($plan))->response()->setStatusCode(201);
    }

    public function update(Request $request, $id, AuditService $audit)
    {
        $service = app(SubscriptionService::class);
        $companyId = $this->companyId($request);
        $plan = SubscriptionPlan::where('company_id', $companyId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'billing_frequency' => ['sometimes', 'required', 'string', 'in:monthly,bimonthly,quarterly,semi_annual,annual'],
            'grace_days' => ['nullable', 'integer', 'min:0'],
            'auto_renew' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $updatedPlan = $service->updatePlan($plan, $data);
        $audit->record('subscription_plan.updated', $updatedPlan, $request);

        return new SubscriptionPlanResource($updatedPlan);
    }
}
