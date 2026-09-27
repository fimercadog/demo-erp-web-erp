<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AccountPayableResource;
use App\Models\AccountPayable;
use App\Services\AccountsService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountPayableController extends BaseCrudController
{
    protected string $model = AccountPayable::class;

    protected string $resource = AccountPayableResource::class;

    protected array $with = ['supplier', 'purchaseOrder', 'receipt'];

    protected array $filterable = ['status' => 'status', 'supplier_id' => 'supplier_id'];

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $query = AccountPayable::query()
            ->where('company_id', $companyId)
            ->with($this->with);

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'overdue') {
                $query->where('balance', '>', 0)
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString());
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->has('due_from')) {
            $query->where('due_date', '>=', $request->input('due_from'));
        }

        if ($request->has('due_to')) {
            $query->where('due_date', '<=', $request->input('due_to'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->orderBy('due_date', 'asc')->paginate($perPage);

        return AccountPayableResource::collection($records);
    }

    public function aging(Request $request, AccountsService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $asOfDate = $request->input('as_of_date');
        $report = $service->getPayablesAging($companyId, $asOfDate);

        return response()->json(['data' => $report]);
    }

    public function summary(Request $request, AccountsService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $summary = $service->getPayablesSummary($companyId);

        return response()->json(['data' => $summary]);
    }
}
