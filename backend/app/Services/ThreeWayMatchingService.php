<?php

namespace App\Services;

use App\Models\AccountPayable;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;

class ThreeWayMatchingService
{
    /**
     * Evaluate 3-Way Match for a Purchase Order (PO vs Receipt vs Invoice/Payable).
     */
    public function evaluateMatch(int $purchaseOrderId): array
    {
        $po = PurchaseOrder::with(['items.product', 'supplier'])
            ->findOrFail($purchaseOrderId);

        $payables = AccountPayable::where('purchase_order_id', $po->id)->get();
        $receipts = PurchaseReceipt::with('items')->where('purchase_order_id', $po->id)->get();

        $hasReceipts = $receipts->count() > 0;
        $hasInvoices = $payables->count() > 0;

        $totalOrderedAmount = (float) $po->total;
        $totalInvoicedAmount = (float) $payables->sum('original_amount');

        $itemBreakdown = [];
        $hasQtyMismatch = false;

        foreach ($po->items as $item) {
            $productId = $item->product_id;
            $orderedQty = (int) $item->quantity;
            $unitCost = (float) ($item->unit_cost ?? $item->unit_price ?? 0);

            // Calculate total received qty across all receipts for this PO
            $receivedQty = 0;
            foreach ($receipts as $receipt) {
                foreach ($receipt->items as $rItem) {
                    if ((int) $rItem->product_id === (int) $productId) {
                        $receivedQty += (int) $rItem->quantity;
                    }
                }
            }

            $qtyMatch = ($orderedQty === $receivedQty);
            if (! $qtyMatch && $hasReceipts) {
                $hasQtyMismatch = true;
            }

            $itemBreakdown[] = [
                'product_id' => $productId,
                'product_name' => $item->product->name ?? $item->product_name ?? 'Producto',
                'sku' => $item->product->sku ?? $item->sku ?? '-',
                'ordered_quantity' => $orderedQty,
                'received_quantity' => $receivedQty,
                'unit_cost' => $unitCost,
                'total_ordered' => (float) ($item->line_total ?? ($orderedQty * $unitCost)),
                'quantity_matched' => $qtyMatch,
            ];
        }

        $amountDiff = abs($totalOrderedAmount - $totalInvoicedAmount);
        $hasAmountMismatch = $hasInvoices && ($amountDiff > 0.01);

        // Determine Status
        if (! $hasReceipts || ! $hasInvoices) {
            $status = 'pending';
            $notes = 'Pendiente de recepción de almacén o factura de proveedor.';
        } elseif ($hasQtyMismatch || $hasAmountMismatch) {
            $status = 'discrepancy';
            $notes = sprintf(
                'Discrepancia detectada en 3 Vías. %s%s',
                $hasQtyMismatch ? 'Diferencia en cantidades recibidas. ' : '',
                $hasAmountMismatch ? "Diferencia de monto ($" . number_format($amountDiff, 2) . "). " : ''
            );
        } else {
            $status = 'matched';
            $notes = 'Coincidencia exacta de 3 vías (Orden == Recepción == Factura).';
        }

        // Update PO and Payables
        $po->update([
            'three_way_match_status' => $status,
            'three_way_match_notes' => trim($notes),
            'matched_at' => $status === 'matched' ? now() : null,
        ]);

        foreach ($payables as $payable) {
            $payable->update(['three_way_match_status' => $status]);
        }

        return [
            'purchase_order_id' => $po->id,
            'status' => $status,
            'notes' => trim($notes),
            'summary' => [
                'has_receipts' => $hasReceipts,
                'receipts_count' => $receipts->count(),
                'has_invoices' => $hasInvoices,
                'invoices_count' => $payables->count(),
                'total_ordered' => $totalOrderedAmount,
                'total_invoiced' => $totalInvoicedAmount,
                'amount_difference' => $amountDiff,
            ],
            'items_breakdown' => $itemBreakdown,
        ];
    }
}
