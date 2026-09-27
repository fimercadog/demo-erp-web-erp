<?php

namespace App\Services;

use App\Models\AccountPayable;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReturn;
use App\Models\SalesReturn;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnsService
{
    /**
     * Procesar Devolución de Ventas
     *
     * @param  array<string, mixed>  $data
     */
    public function processSalesReturn(array $data, int $companyId, int $userId): SalesReturn
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = SalesReturn::query()
                    ->where('company_id', $companyId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();

                if ($existing) {
                    return $existing->load('items', 'invoice', 'client', 'creditNote');
                }
            }

            $invoice = ! empty($data['invoice_id'])
                ? Invoice::query()->where('company_id', $companyId)->findOrFail($data['invoice_id'])
                : null;

            $clientId = $data['client_id'] ?? $invoice?->client_id;
            if (! $clientId) {
                throw ValidationException::withMessages(['client_id' => 'El cliente es obligatorio.']);
            }

            $warehouseId = $data['warehouse_id'] ?? $invoice?->warehouse_id;
            $condition = $data['condition'] ?? 'good_condition';
            $returnType = $data['return_type'] ?? 'credit_note';
            $reason = $data['reason'] ?? 'Devolución de cliente';

            $items = $data['items'] ?? [];
            $totalAmount = 0.0;
            $itemsData = [];

            foreach ($items as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $price = (float) ($item['unit_price'] ?? 0);
                $lineTotal = round($price * $qty, 2);
                $totalAmount += $lineTotal;

                $itemsData[] = [
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? 'Producto Devolución',
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'line_total' => $lineTotal,
                ];
            }

            $number = $data['number'] ?? $this->nextSalesReturnNumber($companyId);
            $creditNoteId = null;

            // Generar Nota Crédito automática si la devolución genera nota crédito y hay factura
            if ($returnType === 'credit_note' && $invoice) {
                $cnService = app(CreditDebitNoteService::class);
                $creditNote = $cnService->createCreditNote([
                    'invoice_id' => $invoice->id,
                    'reason' => 'Devolución de venta '.$number.': '.$reason,
                    'total' => $totalAmount,
                    'restock_inventory' => false, // ya se maneja el movimiento en la devolución
                    'items' => array_map(fn ($row) => [
                        'product_id' => $row['product_id'],
                        'product_name' => $row['product_name'],
                        'quantity' => $row['quantity'],
                        'unit_price' => $row['unit_price'],
                    ], $itemsData),
                ], $companyId, $userId);

                $creditNoteId = $creditNote->id;
            }

            $salesReturn = SalesReturn::create([
                'company_id' => $companyId,
                'invoice_id' => $invoice?->id,
                'client_id' => $clientId,
                'warehouse_id' => $warehouseId,
                'user_id' => $userId,
                'credit_note_id' => $creditNoteId,
                'number' => $number,
                'return_type' => $returnType,
                'condition' => $condition,
                'reason' => $reason,
                'status' => 'completed',
                'total_amount' => round($totalAmount, 2),
                'notes' => $data['notes'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($itemsData as $itemRow) {
                $salesReturn->items()->create($itemRow);
            }

            // Reingreso a Inventario si la mercancía está en buen estado
            if ($condition === 'good_condition' && $warehouseId) {
                foreach ($itemsData as $itemRow) {
                    if (empty($itemRow['product_id'])) {
                        continue;
                    }

                    StockMovement::create([
                        'company_id' => $companyId,
                        'user_id' => $userId,
                        'product_id' => $itemRow['product_id'],
                        'warehouse_id' => $warehouseId,
                        'type' => 'DEVOLUCION_VENTA',
                        'quantity' => $itemRow['quantity'],
                        'reason' => 'Reingreso por Devolución '.$salesReturn->number,
                        'reference' => 'sales_return:'.$salesReturn->id,
                        'idempotency_key' => 'sr:'.$salesReturn->id.':item:'.$itemRow['product_id'],
                    ]);
                }
            }

            return $salesReturn->load('items', 'invoice', 'client', 'creditNote');
        });
    }

    /**
     * Procesar Devolución a Proveedor
     *
     * @param  array<string, mixed>  $data
     */
    public function processPurchaseReturn(array $data, int $companyId, int $userId): PurchaseReturn
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = PurchaseReturn::query()
                    ->where('company_id', $companyId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();

                if ($existing) {
                    return $existing->load('items', 'purchaseOrder', 'supplier');
                }
            }

            $po = ! empty($data['purchase_order_id'])
                ? PurchaseOrder::query()->where('company_id', $companyId)->find($data['purchase_order_id'])
                : null;

            $receipt = ! empty($data['purchase_receipt_id'])
                ? PurchaseReceipt::query()->where('company_id', $companyId)->find($data['purchase_receipt_id'])
                : null;

            $supplierId = $data['supplier_id'] ?? $po?->supplier_id ?? $receipt?->supplier_id;
            if (! $supplierId) {
                throw ValidationException::withMessages(['supplier_id' => 'El proveedor es obligatorio.']);
            }

            $warehouseId = $data['warehouse_id'] ?? $po?->warehouse_id ?? $receipt?->warehouse_id;
            $reason = $data['reason'] ?? 'Devolución a proveedor por falla o garantía';

            $items = $data['items'] ?? [];
            $totalAmount = 0.0;
            $itemsData = [];

            foreach ($items as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $cost = (float) ($item['unit_cost'] ?? 0);
                $lineTotal = round($cost * $qty, 2);
                $totalAmount += $lineTotal;

                $itemsData[] = [
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? 'Producto Devolución Proveedor',
                    'quantity' => $qty,
                    'unit_cost' => $cost,
                    'line_total' => $lineTotal,
                ];
            }

            $number = $data['number'] ?? $this->nextPurchaseReturnNumber($companyId);

            $purchaseReturn = PurchaseReturn::create([
                'company_id' => $companyId,
                'purchase_order_id' => $po?->id,
                'purchase_receipt_id' => $receipt?->id,
                'supplier_id' => $supplierId,
                'warehouse_id' => $warehouseId,
                'user_id' => $userId,
                'number' => $number,
                'reason' => $reason,
                'status' => 'completed',
                'total_amount' => round($totalAmount, 2),
                'notes' => $data['notes'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($itemsData as $itemRow) {
                $purchaseReturn->items()->create($itemRow);
            }

            // Salida de Inventario por devolución al proveedor
            if ($warehouseId) {
                foreach ($itemsData as $itemRow) {
                    if (empty($itemRow['product_id'])) {
                        continue;
                    }

                    StockMovement::create([
                        'company_id' => $companyId,
                        'user_id' => $userId,
                        'product_id' => $itemRow['product_id'],
                        'warehouse_id' => $warehouseId,
                        'type' => 'DEVOLUCION_PROVEEDOR',
                        'quantity' => -$itemRow['quantity'],
                        'reason' => 'Salida por Devolución a Proveedor '.$purchaseReturn->number,
                        'reference' => 'purchase_return:'.$purchaseReturn->id,
                        'idempotency_key' => 'pr:'.$purchaseReturn->id.':item:'.$itemRow['product_id'],
                    ]);
                }
            }

            // Ajuste en AccountPayable (reducir deuda con proveedor)
            $payableQuery = AccountPayable::query()->where('company_id', $companyId)->where('supplier_id', $supplierId);
            if ($po) {
                $payableQuery->where('purchase_order_id', $po->id);
            }
            $payable = $payableQuery->where('balance', '>', 0)->lockForUpdate()->first();

            if ($payable) {
                $newBalance = max(0, round((float) $payable->balance - $totalAmount, 2));
                $newStatus = $newBalance <= 0 ? 'paid' : ($payable->paid_amount > 0 ? 'partial' : 'pending');
                $payable->update([
                    'balance' => $newBalance,
                    'status' => $newStatus,
                ]);
            }

            return $purchaseReturn->load('items', 'purchaseOrder', 'supplier');
        });
    }

    private function nextSalesReturnNumber(int $companyId): string
    {
        $next = SalesReturn::where('company_id', $companyId)->lockForUpdate()->count() + 1;

        return 'DV-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextPurchaseReturnNumber(int $companyId): string
    {
        $next = PurchaseReturn::where('company_id', $companyId)->lockForUpdate()->count() + 1;

        return 'DP-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
