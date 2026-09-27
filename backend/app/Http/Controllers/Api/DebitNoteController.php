<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\DebitNoteResource;
use App\Models\DebitNote;
use App\Services\AuditService;
use App\Services\CreditDebitNoteService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DebitNoteController extends BaseCrudController
{
    protected string $model = DebitNote::class;

    protected string $resource = DebitNoteResource::class;

    protected array $with = ['invoice', 'client', 'items'];

    protected array $searchable = ['number', 'reason', 'notes'];

    protected array $filterable = ['status' => 'status', 'invoice_id' => 'invoice_id', 'client_id' => 'client_id'];

    public function store(Request $request, AuditService $audit)
    {
        $service = app(CreditDebitNoteService::class);
        $companyId = $this->companyId($request);
        $data = $request->validate([
            'invoice_id' => ['required', Rule::exists('invoices', 'id')->where('company_id', $companyId)],
            'reason' => ['required', 'string', 'max:255'],
            'total' => ['nullable', 'numeric', 'min:0.01'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $debitNote = $service->createDebitNote($data, $companyId, $request->user()->id);
        $audit->record('debit_note.created', $debitNote, $request);

        return (new DebitNoteResource($debitNote))->response()->setStatusCode(201);
    }
}
