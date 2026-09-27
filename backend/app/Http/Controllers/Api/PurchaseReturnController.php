<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\PurchaseReturnResource;
use App\Models\PurchaseReturn;
use App\Services\AuditService;
use App\Services\ReturnsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PurchaseReturnController extends BaseCrudController
{
    protected string $model = PurchaseReturn::class;

    protected string $resource = PurchaseReturnResource::class;

    protected array $with = ['purchaseOrder', 'purchaseReceipt', 'supplier', 'warehouse', 'items'];

    protected array $searchable = ['number', 'reason', 'notes'];

    protected array $filterable = ['status' => 'status', 'supplier_id' => 'supplier_id', 'purchase_order_id' => 'purchase_order_id'];

    public function store(Request $request, AuditService $audit)
    {
        $service = app(ReturnsService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'purchase_order_id' => ['nullable', Rule::exists('purchase_orders', 'id')->where('company_id', $companyId)],
            'purchase_receipt_id' => ['nullable', Rule::exists('purchase_receipts', 'id')->where('company_id', $companyId)],
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['nullable', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $purchaseReturn = $service->processPurchaseReturn($data, $companyId, $request->user()->id);
        $audit->record('purchase_return.created', $purchaseReturn, $request);

        return (new PurchaseReturnResource($purchaseReturn))->response()->setStatusCode(201);
    }
}
