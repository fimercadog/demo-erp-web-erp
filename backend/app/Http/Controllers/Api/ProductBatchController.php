<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ProductBatchResource;
use App\Models\ProductBatch;
use App\Services\AuditService;
use App\Services\BatchService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductBatchController extends BaseCrudController
{
    protected string $model = ProductBatch::class;

    protected string $resource = ProductBatchResource::class;

    protected array $with = ['product', 'warehouse', 'supplier', 'purchaseReceipt'];

    protected array $searchable = ['batch_number', 'notes'];

    protected array $filterable = ['status' => 'status', 'product_id' => 'product_id', 'warehouse_id' => 'warehouse_id'];

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $query = ProductBatch::query()
            ->where('company_id', $companyId)
            ->with($this->with);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'expired') {
                $query->where('current_quantity', '>', 0)
                    ->whereNotNull('expiration_date')
                    ->where('expiration_date', '<', now()->toDateString());
            } elseif ($status === 'near_expiration') {
                $threshold = now()->startOfDay()->addDays((int) $request->input('days', 30))->toDateString();
                $query->where('current_quantity', '>', 0)
                    ->whereNotNull('expiration_date')
                    ->where('expiration_date', '>=', now()->toDateString())
                    ->where('expiration_date', '<=', $threshold);
            } else {
                $query->where('status', $status);
            }
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->orderBy('expiration_date', 'asc')->paginate($perPage);

        return ProductBatchResource::collection($records);
    }

    public function store(Request $request, AuditService $audit)
    {
        $service = app(BatchService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'product_id' => ['required', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['nullable', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('company_id', $companyId)],
            'purchase_receipt_id' => ['nullable', Rule::exists('purchase_receipts', 'id')->where('company_id', $companyId)],
            'batch_number' => ['required', 'string', 'max:100'],
            'manufacturing_date' => ['nullable', 'date'],
            'expiration_date' => ['nullable', 'date'],
            'initial_quantity' => ['required', 'integer', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $batch = $service->createOrUpdateBatch($data, $companyId);
        $audit->record('product_batch.created', $batch, $request);

        return (new ProductBatchResource($batch))->response()->setStatusCode(201);
    }

    public function expiringReport(Request $request, BatchService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $thresholdDays = (int) $request->input('days', 30);
        $warehouseId = $request->has('warehouse_id') ? (int) $request->input('warehouse_id') : null;

        $report = $service->getExpirationReport($companyId, $thresholdDays, $warehouseId);

        return response()->json(['data' => $report]);
    }

    public function traceability(Request $request, string $id, BatchService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $report = $service->getBatchTraceability($companyId, (int) $id);

        return response()->json(['data' => $report]);
    }
}
