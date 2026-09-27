<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\SalesReturnResource;
use App\Models\SalesReturn;
use App\Services\AuditService;
use App\Services\ReturnsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalesReturnController extends BaseCrudController
{
    protected string $model = SalesReturn::class;

    protected string $resource = SalesReturnResource::class;

    protected array $with = ['invoice', 'client', 'warehouse', 'creditNote', 'items'];

    protected array $searchable = ['number', 'reason', 'notes'];

    protected array $filterable = ['status' => 'status', 'client_id' => 'client_id', 'invoice_id' => 'invoice_id'];

    public function store(Request $request, AuditService $audit)
    {
        $service = app(ReturnsService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'invoice_id' => ['nullable', Rule::exists('invoices', 'id')->where('company_id', $companyId)],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['nullable', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'return_type' => ['nullable', 'string', 'in:credit_note,refund,exchange'],
            'condition' => ['nullable', 'string', 'in:good_condition,damaged'],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $salesReturn = $service->processSalesReturn($data, $companyId, $request->user()->id);
        $audit->record('sales_return.created', $salesReturn, $request);

        return (new SalesReturnResource($salesReturn))->response()->setStatusCode(201);
    }
}
