<?php

namespace App\Services;

use App\Models\AccountReceivable;
use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreditDebitNoteService
{
    /**
     * Crear y emitir una Nota Crédito
     *
     * @param  array<string, mixed>  $data
     */
    public function createCreditNote(array $data, int $companyId, int $userId): CreditNote
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = CreditNote::query()
                    ->where('company_id', $companyId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();

                if ($existing) {
                    return $existing->load('items', 'invoice', 'client');
                }
            }

            $invoice = Invoice::query()
                ->where('company_id', $companyId)
                ->whereKey($data['invoice_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($invoice->status, ['issued', 'partially_paid', 'paid'], true)) {
                throw ValidationException::withMessages([
                    'invoice_id' => 'Solo se pueden emitir notas crédito sobre facturas emitidas o pagadas.',
                ]);
            }

            $items = $data['items'] ?? [];
            $subtotal = 0.0;
            $tax = 0.0;
            $discount = 0.0;
            $total = 0.0;

            $itemsData = [];

            if (! empty($items)) {
                foreach ($items as $item) {
                    $qty = (int) ($item['quantity'] ?? 1);
                    $price = (float) ($item['unit_price'] ?? 0);
                    $itemDiscount = (float) ($item['discount'] ?? 0);
                    $itemTax = (float) ($item['tax'] ?? 0);
                    $lineTotal = round(($price * $qty) - $itemDiscount + $itemTax, 2);

                    $subtotal += ($price * $qty);
                    $discount += $itemDiscount;
                    $tax += $itemTax;
                    $total += $lineTotal;

                    $itemsData[] = [
                        'product_id' => $item['product_id'] ?? null,
                        'product_name' => $item['product_name'] ?? 'Ajuste de Factura',
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'discount' => $itemDiscount,
                        'tax' => $itemTax,
                        'line_total' => $lineTotal,
                    ];
                }
            } else {
                $total = (float) ($data['total'] ?? $invoice->total);
                $subtotal = (float) ($data['subtotal'] ?? $total);
                $tax = (float) ($data['tax'] ?? 0);
                $discount = (float) ($data['discount'] ?? 0);

                $itemsData[] = [
                    'product_id' => null,
                    'product_name' => 'Nota Crédito por '.$data['reason'],
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'line_total' => $total,
                ];
            }

            $number = $data['number'] ?? $this->nextCreditNoteNumber($companyId);
            $restock = (bool) ($data['restock_inventory'] ?? false);

            $creditNote = CreditNote::create([
                'company_id' => $companyId,
                'invoice_id' => $invoice->id,
                'client_id' => $invoice->client_id,
                'user_id' => $userId,
                'number' => $number,
                'type' => $data['type'] ?? ($total >= (float) $invoice->total ? 'total' : 'partial'),
                'reason' => $data['reason'] ?? 'Anulación o ajuste de factura',
                'status' => 'issued',
                'subtotal' => round($subtotal, 2),
                'discount' => round($discount, 2),
                'tax' => round($tax, 2),
                'total' => round($total, 2),
                'restock_inventory' => $restock,
                'notes' => $data['notes'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($itemsData as $itemRow) {
                $creditNote->items()->create($itemRow);
            }

            // Actualización financiera en AccountReceivable
            $receivable = AccountReceivable::query()
                ->where('company_id', $companyId)
                ->where('invoice_id', $invoice->id)
                ->lockForUpdate()
                ->first();

            if ($receivable) {
                $newBalance = max(0, round((float) $receivable->balance - $total, 2));
                $newStatus = $newBalance <= 0 ? 'paid' : ($receivable->paid_amount > 0 ? 'partial' : 'pending');

                $receivable->update([
                    'balance' => $newBalance,
                    'status' => $newStatus,
                ]);
            }

            // Actualización de estado en Factura si se acredita por completo
            if ($total >= (float) $invoice->total) {
                $invoice->update(['status' => 'credited']);
            }

            // Reingreso a inventario si aplica
            if ($restock && $invoice->warehouse_id) {
                foreach ($itemsData as $itemRow) {
                    if (empty($itemRow['product_id'])) {
                        continue;
                    }

                    StockMovement::create([
                        'company_id' => $companyId,
                        'user_id' => $userId,
                        'product_id' => $itemRow['product_id'],
                        'warehouse_id' => $invoice->warehouse_id,
                        'type' => 'DEVOLUCION_VENTA',
                        'quantity' => $itemRow['quantity'],
                        'reason' => 'Devolución por Nota Crédito '.$creditNote->number,
                        'reference' => 'credit_note:'.$creditNote->id,
                        'idempotency_key' => 'cn:'.$creditNote->id.':item:'.$itemRow['product_id'],
                    ]);
                }
            }

            return $creditNote->load('items', 'invoice', 'client');
        });
    }

    /**
     * Crear y emitir una Nota Débito
     *
     * @param  array<string, mixed>  $data
     */
    public function createDebitNote(array $data, int $companyId, int $userId): DebitNote
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = DebitNote::query()
                    ->where('company_id', $companyId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();

                if ($existing) {
                    return $existing->load('items', 'invoice', 'client');
                }
            }

            $invoice = Invoice::query()
                ->where('company_id', $companyId)
                ->whereKey($data['invoice_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($invoice->status, ['issued', 'partially_paid', 'paid'], true)) {
                throw ValidationException::withMessages([
                    'invoice_id' => 'Solo se pueden emitir notas débito sobre facturas emitidas.',
                ]);
            }

            $items = $data['items'] ?? [];
            $subtotal = 0.0;
            $tax = 0.0;
            $total = 0.0;

            $itemsData = [];

            if (! empty($items)) {
                foreach ($items as $item) {
                    $qty = (int) ($item['quantity'] ?? 1);
                    $price = (float) ($item['unit_price'] ?? 0);
                    $lineTotal = round($price * $qty, 2);

                    $subtotal += $lineTotal;
                    $total += $lineTotal;

                    $itemsData[] = [
                        'product_id' => $item['product_id'] ?? null,
                        'product_name' => $item['product_name'] ?? 'Ajuste Débito de Factura',
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'line_total' => $lineTotal,
                    ];
                }
            } else {
                $total = (float) ($data['total'] ?? 0);
                $subtotal = (float) ($data['subtotal'] ?? $total);
                $tax = (float) ($data['tax'] ?? 0);
                $total += $tax;

                $itemsData[] = [
                    'product_id' => null,
                    'product_name' => 'Nota Débito por '.$data['reason'],
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'line_total' => $total,
                ];
            }

            $number = $data['number'] ?? $this->nextDebitNoteNumber($companyId);

            $debitNote = DebitNote::create([
                'company_id' => $companyId,
                'invoice_id' => $invoice->id,
                'client_id' => $invoice->client_id,
                'user_id' => $userId,
                'number' => $number,
                'reason' => $data['reason'] ?? 'Aumento de valor o recargo de factura',
                'status' => 'issued',
                'subtotal' => round($subtotal, 2),
                'tax' => round($tax, 2),
                'total' => round($total, 2),
                'notes' => $data['notes'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($itemsData as $itemRow) {
                $debitNote->items()->create($itemRow);
            }

            // Incremento financiero en AccountReceivable
            $receivable = AccountReceivable::query()
                ->where('company_id', $companyId)
                ->where('invoice_id', $invoice->id)
                ->lockForUpdate()
                ->first();

            if ($receivable) {
                $newOriginal = round((float) $receivable->original_amount + $total, 2);
                $newBalance = round((float) $receivable->balance + $total, 2);
                $newStatus = $newBalance > 0 ? ($receivable->paid_amount > 0 ? 'partial' : 'pending') : 'paid';

                $receivable->update([
                    'original_amount' => $newOriginal,
                    'balance' => $newBalance,
                    'status' => $newStatus,
                ]);
            }

            return $debitNote->load('items', 'invoice', 'client');
        });
    }

    private function nextCreditNoteNumber(int $companyId): string
    {
        $next = CreditNote::where('company_id', $companyId)->lockForUpdate()->count() + 1;

        return 'NC-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextDebitNoteNumber(int $companyId): string
    {
        $next = DebitNote::where('company_id', $companyId)->lockForUpdate()->count() + 1;

        return 'ND-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
