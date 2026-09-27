<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\CreditNoteResource;
use App\Models\CreditNote;
use App\Services\AuditService;
use App\Services\CreditDebitNoteService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CreditNoteController extends BaseCrudController
{
    protected string $model = CreditNote::class;

    protected string $resource = CreditNoteResource::class;

    protected array $with = ['invoice', 'client', 'items'];

    protected array $searchable = ['number', 'reason', 'notes'];

    protected array $filterable = ['status' => 'status', 'invoice_id' => 'invoice_id', 'client_id' => 'client_id'];

    public function store(Request $request, AuditService $audit)
    {
        $service = app(CreditDebitNoteService::class);
        $companyId = $this->companyId($request);
        $data = $request->validate([
            'invoice_id' => ['required', Rule::exists('invoices', 'id')->where('company_id', $companyId)],
            'type' => ['nullable', 'string', 'in:total,partial'],
            'reason' => ['required', 'string', 'max:255'],
            'total' => ['nullable', 'numeric', 'min:0.01'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'restock_inventory' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax' => ['nullable', 'numeric', 'min:0'],
        ]);

        $creditNote = $service->createCreditNote($data, $companyId, $request->user()->id);
        $audit->record('credit_note.created', $creditNote, $request);

        return (new CreditNoteResource($creditNote))->response()->setStatusCode(201);
    }
}
