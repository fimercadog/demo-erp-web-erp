<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\StockMovement;
use Carbon\Carbon;

class BatchService
{
    /**
     * Crear o actualizar un lote de producto
     *
     * @param  array<string, mixed>  $data
     */
    public function createOrUpdateBatch(array $data, int $companyId): ProductBatch
    {
        $productId = (int) $data['product_id'];
        $batchNumber = trim((string) $data['batch_number']);
        $warehouseId = ! empty($data['warehouse_id']) ? (int) $data['warehouse_id'] : null;

        $batch = ProductBatch::query()
            ->where('company_id', $companyId)
            ->where('product_id', $productId)
            ->where('batch_number', $batchNumber)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->first();

        $quantity = (int) ($data['initial_quantity'] ?? $data['quantity'] ?? 0);
        $unitCost = (float) ($data['unit_cost'] ?? 0);

        if (! $batch) {
            $batch = ProductBatch::create([
                'company_id' => $companyId,
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'supplier_id' => $data['supplier_id'] ?? null,
                'purchase_receipt_id' => $data['purchase_receipt_id'] ?? null,
                'batch_number' => $batchNumber,
                'manufacturing_date' => $data['manufacturing_date'] ?? null,
                'expiration_date' => $data['expiration_date'] ?? null,
                'initial_quantity' => $quantity,
                'current_quantity' => $quantity,
                'unit_cost' => $unitCost,
                'status' => $quantity > 0 ? 'active' : 'depleted',
                'notes' => $data['notes'] ?? null,
            ]);
        } else {
            $newQuantity = max(0, $batch->current_quantity + $quantity);
            $batch->update([
                'current_quantity' => $newQuantity,
                'manufacturing_date' => $data['manufacturing_date'] ?? $batch->manufacturing_date,
                'expiration_date' => $data['expiration_date'] ?? $batch->expiration_date,
                'unit_cost' => $unitCost > 0 ? $unitCost : $batch->unit_cost,
                'status' => $newQuantity > 0 ? 'active' : 'depleted',
            ]);
        }

        $this->syncBatchStatus($batch);

        return $batch->fresh(['product', 'warehouse', 'supplier', 'purchaseReceipt']);
    }

    /**
     * Registrar un movimiento de inventario sobre un lote específico
     */
    public function registerBatchMovement(StockMovement $movement, int $batchId): ProductBatch
    {
        $batch = ProductBatch::query()
            ->where('company_id', $movement->company_id)
            ->findOrFail($batchId);

        $movement->update(['product_batch_id' => $batch->id]);

        $newQuantity = max(0, $batch->current_quantity + (int) $movement->quantity);
        $batch->update(['current_quantity' => $newQuantity]);

        $this->syncBatchStatus($batch);

        return $batch->fresh();
    }

    /**
     * Obtener el mejor lote según regla FEFO (First Expired, First Out)
     */
    public function getFefoBatch(int $companyId, int $productId, ?int $warehouseId = null, int $requiredQuantity = 1): ?ProductBatch
    {
        return ProductBatch::query()
            ->where('company_id', $companyId)
            ->where('product_id', $productId)
            ->where('current_quantity', '>=', $requiredQuantity)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->whereNotNull('expiration_date')
            ->where('expiration_date', '>=', now()->toDateString())
            ->orderBy('expiration_date', 'asc')
            ->first();
    }

    /**
     * Obtener el mejor lote según regla FIFO (First In, First Out)
     */
    public function getFifoBatch(int $companyId, int $productId, ?int $warehouseId = null): ?ProductBatch
    {
        return ProductBatch::query()
            ->where('company_id', $companyId)
            ->where('product_id', $productId)
            ->where('current_quantity', '>', 0)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->orderBy('created_at', 'asc')
            ->first();
    }

    /**
     * Reporte de vencimientos de lotes e indicadores económicos
     *
     * @return array<string, mixed>
     */
    public function getExpirationReport(int $companyId, int $thresholdDays = 30, ?int $warehouseId = null): array
    {
        $now = now()->startOfDay();
        $thresholdDate = (clone $now)->addDays($thresholdDays)->toDateString();

        $query = ProductBatch::query()
            ->where('company_id', $companyId)
            ->where('current_quantity', '>', 0)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->with(['product:id,sku,name,cost_price,unit_price', 'warehouse:id,name']);

        $allBatches = (clone $query)->whereNotNull('expiration_date')->get();

        $expired = [];
        $nearExpiration = [];

        $expiredValue = 0.0;
        $nearValue = 0.0;

        foreach ($allBatches as $batch) {
            $cost = (float) ($batch->unit_cost > 0 ? $batch->unit_cost : $batch->product?->cost_price ?? 0);
            $itemValue = round($cost * $batch->current_quantity, 2);

            if ($batch->expiration_date->isPast() && ! $batch->expiration_date->isToday()) {
                $expired[] = $batch;
                $expiredValue += $itemValue;
            } elseif ($batch->expiration_date->toDateString() <= $thresholdDate) {
                $nearExpiration[] = $batch;
                $nearValue += $itemValue;
            }
        }

        return [
            'as_of_date' => $now->toDateString(),
            'threshold_days' => $thresholdDays,
            'summary' => [
                'total_active_batches' => $allBatches->count(),
                'expired_count' => count($expired),
                'near_expiration_count' => count($nearExpiration),
                'expired_economic_value' => round($expiredValue, 2),
                'near_expiration_economic_value' => round($nearValue, 2),
            ],
            'expired_batches' => $expired,
            'near_expiration_batches' => $nearExpiration,
        ];
    }

    /**
     * Reporte de trazabilidad completa de un lote
     *
     * @return array<string, mixed>
     */
    public function getBatchTraceability(int $companyId, int $batchId): array
    {
        $batch = ProductBatch::query()
            ->where('company_id', $companyId)
            ->with(['product', 'warehouse', 'supplier', 'purchaseReceipt', 'stockMovements.warehouse'])
            ->findOrFail($batchId);

        return [
            'batch' => $batch,
            'movements' => $batch->stockMovements,
            'total_in' => (int) $batch->stockMovements->where('quantity', '>', 0)->sum('quantity'),
            'total_out' => (int) abs($batch->stockMovements->where('quantity', '<', 0)->sum('quantity')),
            'current_balance' => $batch->current_quantity,
        ];
    }

    private function syncBatchStatus(ProductBatch $batch): void
    {
        if ($batch->current_quantity <= 0) {
            $batch->update(['status' => 'depleted']);

            return;
        }

        if ($batch->expiration_date) {
            if ($batch->expiration_date->isPast() && ! $batch->expiration_date->isToday()) {
                $batch->update(['status' => 'expired']);

                return;
            }

            $daysLeft = now()->startOfDay()->diffInDays($batch->expiration_date, false);
            if ($daysLeft >= 0 && $daysLeft <= 30) {
                $batch->update(['status' => 'near_expiration']);

                return;
            }
        }

        $batch->update(['status' => 'active']);
    }
}
