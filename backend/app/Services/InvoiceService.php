<?php

namespace App\Services;

use App\Models\AccountReceivable;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(private ErpTotals $totals) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createDraft(array $data, int $companyId, int $userId): Invoice
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = Invoice::query()->where('company_id', $companyId)->where('idempotency_key', $data['idempotency_key'])->first();
                if ($existing) {
                    return $existing->load('items', 'client', 'receivable');
                }
            }

            $items = $this->snapshotItems($data['items'] ?? [], $companyId);
            $totals = $this->totals->calculate($items);
            $number = $data['number'] ?? $this->nextNumber($companyId);

            $invoice = Invoice::create([
                'company_id' => $companyId,
                'client_id' => $data['client_id'],
                'order_id' => $data['order_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'user_id' => $userId,
                'number' => $number,
                'issue_date' => $data['issue_date'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'status' => 'draft',
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'notes' => $data['notes'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($totals['items'] as $item) {
                $invoice->items()->create([
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'sku' => $item['sku'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'tax' => $item['tax'],
                    'line_total' => $item['line_total'],
                ]);
            }

            return $invoice->load('items', 'client', 'receivable');
        });
    }

    public function issue(Invoice $invoice, int $userId): Invoice
    {
        return DB::transaction(function () use ($invoice, $userId) {
            $invoice = Invoice::query()->whereKey($invoice->id)->lockForUpdate()->with('items.product')->firstOrFail();
            abort_if($invoice->status !== 'draft', 422, 'La factura ya fue emitida o anulada.');

            if ($invoice->warehouse_id) {
                foreach ($invoice->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }
                    $stock = Product::findOrFail($item->product_id)->stockOnHand($invoice->warehouse_id);
                    if ($stock < $item->quantity) {
                        throw ValidationException::withMessages(['items' => 'Sin existencias suficientes para '.$item->product_name.'.']);
                    }
                }
                foreach ($invoice->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }
                    StockMovement::create([
                        'company_id' => $invoice->company_id,
                        'user_id' => $userId,
                        'product_id' => $item->product_id,
                        'warehouse_id' => $invoice->warehouse_id,
                        'type' => 'VENTA',
                        'quantity' => -$item->quantity,
                        'reason' => 'Emision de factura interna',
                        'reference' => 'invoice:'.$invoice->id,
                        'idempotency_key' => 'invoice:'.$invoice->id.':item:'.$item->id,
                    ]);
                }
            }

            $invoice->update([
                'status' => 'issued',
                'issue_date' => $invoice->issue_date ?? now()->toDateString(),
            ]);

            AccountReceivable::firstOrCreate(
                ['invoice_id' => $invoice->id],
                [
                    'company_id' => $invoice->company_id,
                    'client_id' => $invoice->client_id,
                    'original_amount' => $invoice->total,
                    'paid_amount' => 0,
                    'balance' => $invoice->total,
                    'due_date' => $invoice->due_date,
                    'status' => 'pending',
                ],
            );

            return $invoice->load('items', 'client', 'receivable');
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function snapshotItems(array $items, int $companyId): array
    {
        return collect($items)->map(function (array $item) use ($companyId) {
            $product = ! empty($item['product_id'])
                ? Product::query()->where('company_id', $companyId)->findOrFail($item['product_id'])
                : null;

            return [
                'product_id' => $product?->id,
                'product_name' => $item['product_name'] ?? $product?->name ?? 'Servicio',
                'sku' => $product?->sku,
                'quantity' => (float) $item['quantity'],
                'unit_price' => (float) ($item['unit_price'] ?? $product?->unit_price ?? 0),
                'discount' => (float) ($item['discount'] ?? 0),
                'tax' => (float) ($item['tax'] ?? 0),
            ];
        })->all();
    }

    private function nextNumber(int $companyId): string
    {
        $next = Invoice::where('company_id', $companyId)->lockForUpdate()->count() + 1;

        return 'FI-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
