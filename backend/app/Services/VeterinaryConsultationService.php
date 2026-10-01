<?php

namespace App\Services;

use App\Models\AccountReceivable;
use App\Models\Consultation;
use App\Models\ConsultationItem;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Service;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VeterinaryConsultationService
{
    public function __construct(
        protected ErpTotals $totalsCalculator,
        protected PaymentService $paymentService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function addItem(Consultation $consultation, array $data, int $companyId): ConsultationItem
    {
        abort_if($consultation->status === 'completed', 422, 'No se pueden agregar items a una consulta ya finalizada.');

        $itemType = $data['item_type'] ?? 'product';
        $productId = ! empty($data['product_id']) ? (int) $data['product_id'] : null;
        $serviceId = ! empty($data['service_id']) ? (int) $data['service_id'] : null;
        $procedureId = ! empty($data['procedure_id']) ? (int) $data['procedure_id'] : null;

        $quantity = (float) ($data['quantity'] ?? 1);
        abort_if($quantity <= 0, 422, 'La cantidad debe ser un valor mayor a cero.');

        $unitPrice = isset($data['unit_price']) ? (float) $data['unit_price'] : 0.0;
        abort_if($unitPrice < 0, 422, 'El precio unitario no puede ser negativo.');

        $unitCost = isset($data['unit_cost']) ? (float) $data['unit_cost'] : 0.0;
        abort_if($unitCost < 0, 422, 'El costo unitario no puede ser negativo.');

        $isBillable = isset($data['is_billable']) ? (bool) $data['is_billable'] : true;
        $isInventoriable = isset($data['is_inventoriable']) ? (bool) $data['is_inventoriable'] : false;

        $name = $data['name'] ?? null;

        if ($productId) {
            $product = Product::query()->where('company_id', $companyId)->find($productId);
            abort_if(! $product, 422, 'El producto no existe o pertenece a otra empresa.');
            $name = $name ?: $product->name;
            if (! isset($data['unit_price'])) {
                $unitPrice = (float) $product->unit_price;
            }
            if (! isset($data['unit_cost'])) {
                $unitCost = (float) $product->cost_price;
            }
            if (! isset($data['is_inventoriable'])) {
                $isInventoriable = true;
            }
        } elseif ($serviceId) {
            $service = Service::query()->where('company_id', $companyId)->find($serviceId);
            abort_if(! $service, 422, 'El servicio no existe o pertenece a otra empresa.');
            $name = $name ?: $service->name;
            if (! isset($data['unit_price'])) {
                $unitPrice = (float) $service->price;
            }
            if (! isset($data['is_inventoriable'])) {
                $isInventoriable = false;
            }
        } elseif ($procedureId) {
            $procedure = Procedure::query()->where('company_id', $companyId)->find($procedureId);
            abort_if(! $procedure, 422, 'El procedimiento no existe o pertenece a otra empresa.');
        }

        return ConsultationItem::create([
            'company_id' => $companyId,
            'consultation_id' => $consultation->id,
            'item_type' => $itemType,
            'product_id' => $productId,
            'service_id' => $serviceId,
            'procedure_id' => $procedureId,
            'name' => $name ?: 'Item de consulta',
            'quantity' => (float) ($data['quantity'] ?? 1),
            'unit_price' => $unitPrice,
            'unit_cost' => $unitCost,
            'is_billable' => $isBillable,
            'is_inventoriable' => $isInventoriable,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function removeItem(Consultation $consultation, int $itemId): void
    {
        abort_if($consultation->status === 'completed', 422, 'No se pueden eliminar items de una consulta ya finalizada.');

        $item = $consultation->items()->whereKey($itemId)->firstOrFail();
        $item->delete();
    }

    /**
     * Finaliza la consulta clínica de forma atómica:
     * 1. Descuenta del inventario los items inventariables (CONSUMO_CLINICO o VENTA).
     * 2. Genera factura administrativa interna y CxC para los items cobrables.
     * 3. Procesa pago inmediato en caja si se especifica.
     * 4. Congela la consulta con estado 'completed'.
     *
     * @param  array<string, mixed>  $data
     */
    public function finalize(Consultation $consultation, array $data, int $userId): Consultation
    {
        return DB::transaction(function () use ($consultation, $data, $userId) {
            $companyId = $consultation->company_id;

            if (! empty($data['idempotency_key'])) {
                $existing = Consultation::query()
                    ->where('company_id', $companyId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();
                if ($existing && $existing->status === 'completed') {
                    return $existing->load([
                        'patient.client', 'service', 'vet', 'diagnoses',
                        'items.product', 'items.stockMovement', 'invoice.accountReceivable.payments', 'warehouse',
                    ]);
                }
            }

            $consultation = Consultation::query()
                ->where('company_id', $companyId)
                ->whereKey($consultation->id)
                ->lockForUpdate()
                ->with(['items', 'patient.client', 'service'])
                ->firstOrFail();

            abort_if($consultation->status !== 'open', 422, "Solo se pueden finalizar consultas en estado abierto. Estado actual: {$consultation->status}.");

            $warehouseId = null;
            if (! empty($data['warehouse_id'])) {
                $warehouse = Warehouse::query()
                    ->where('company_id', $companyId)
                    ->find((int) $data['warehouse_id']);
                abort_if(! $warehouse, 422, 'La bodega seleccionada no pertenece a esta empresa o no existe.');
                $warehouseId = $warehouse->id;
            } else {
                $warehouseId = $consultation->warehouse_id
                    ?: Warehouse::query()->where('company_id', $companyId)->where('status', 'active')->value('id');
            }

            // 1. Validar existencias y procesar consumos de stock
            foreach ($consultation->items as $item) {
                if ($item->is_inventoriable && $item->product_id) {
                    abort_if(! $warehouseId, 422, 'Se requiere especificar una bodega para descontar stock de medicamentos o insumos.');

                    $product = Product::query()->where('company_id', $companyId)->findOrFail($item->product_id);
                    $qty = (float) $item->quantity;

                    if ($product->stockOnHand($warehouseId) < $qty) {
                        throw ValidationException::withMessages([
                            'warehouse_id' => "Sin existencias suficientes de {$product->name} en la bodega seleccionada.",
                        ]);
                    }

                    $movementType = $item->is_billable ? 'VENTA' : 'CONSUMO_CLINICO';
                    $movement = StockMovement::create([
                        'company_id' => $companyId,
                        'product_id' => $item->product_id,
                        'warehouse_id' => $warehouseId,
                        'user_id' => $userId,
                        'type' => $movementType,
                        'quantity' => -$qty,
                        'reason' => "Consumo en consulta #{$consultation->id} - {$consultation->patient->name}",
                        'reference' => "consultation:{$consultation->id}:item:{$item->id}",
                        'idempotency_key' => "consultation:{$consultation->id}:item:{$item->id}",
                    ]);

                    $item->update(['stock_movement_id' => $movement->id]);
                }
            }

            // 2. Preparar conceptos cobrables para Facturación Interna ERP
            $billableLines = [];

            // Tarifa base de la consulta
            if ((float) $consultation->price > 0) {
                $serviceName = $consultation->service ? "Consulta: {$consultation->service->name}" : 'Honorarios de consulta veterinaria';
                $billableLines[] = [
                    'product_id' => null,
                    'product_name' => $serviceName,
                    'sku' => null,
                    'quantity' => 1,
                    'unit_price' => (float) $consultation->price,
                    'discount' => 0.0,
                    'tax' => 0.0,
                ];
            }

            // Items marcados como cobrables
            foreach ($consultation->items as $item) {
                if ($item->is_billable && (float) $item->unit_price > 0) {
                    $billableLines[] = [
                        'product_id' => $item->product_id,
                        'product_name' => $item->name,
                        'sku' => $item->product?->sku,
                        'quantity' => (float) $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'discount' => 0.0,
                        'tax' => 0.0,
                    ];
                }
            }

            $invoice = null;
            if (! empty($billableLines)) {
                $totals = $this->totalsCalculator->calculate($billableLines);
                $clientId = $consultation->patient->client_id;

                $invoice = Invoice::create([
                    'company_id' => $companyId,
                    'client_id' => $clientId,
                    'number' => 'FAC-CLIN-'.str_pad((string) $consultation->id, 5, '0', STR_PAD_LEFT),
                    'status' => 'draft',
                    'issue_date' => now()->toDateString(),
                    'due_date' => now()->addDays(15)->toDateString(),
                    'subtotal' => $totals['subtotal'],
                    'discount' => $totals['discount'],
                    'discount_amount' => $totals['discount'],
                    'tax' => $totals['tax'],
                    'tax_amount' => $totals['tax'],
                    'total' => $totals['total'],
                    'notes' => "Factura de atención clínica #{$consultation->id} - Paciente: {$consultation->patient->name}",
                    'idempotency_key' => 'invoice:consultation:'.$consultation->id,
                ]);

                foreach ($totals['items'] as $it) {
                    $invoice->items()->create([
                        'product_id' => $it['product_id'] ?? null,
                        'product_name' => $it['product_name'] ?? 'Servicio veterinario',
                        'sku' => $it['sku'] ?? null,
                        'quantity' => $it['quantity'],
                        'unit_price' => $it['unit_price'],
                        'discount' => $it['discount'] ?? 0,
                        'tax' => $it['tax'] ?? 0,
                        'line_total' => $it['line_total'],
                    ]);
                }

                // Emisión de la factura interna y apertura de Cuenta por Cobrar (CxC)
                $invoice->update(['status' => 'issued']);
                $accountReceivable = AccountReceivable::create([
                    'company_id' => $companyId,
                    'client_id' => $clientId,
                    'invoice_id' => $invoice->id,
                    'original_amount' => $invoice->total,
                    'paid_amount' => 0,
                    'balance' => $invoice->total,
                    'due_date' => $invoice->due_date,
                    'status' => 'pending',
                ]);

                // 3. Procesar cobro inmediato en caja si viene configurado
                if (! empty($data['payment'])) {
                    $paymentPayload = [
                        'target_type' => 'receivable',
                        'target_id' => $accountReceivable->id,
                        'amount' => (float) ($data['payment']['amount'] ?? $invoice->total),
                        'method' => $data['payment']['method'] ?? 'cash',
                        'paid_at' => now()->toDateString(),
                        'cash_session_id' => ! empty($data['payment']['cash_session_id']) ? (int) $data['payment']['cash_session_id'] : null,
                        'reference' => $data['payment']['reference'] ?? "Pago consulta #{$consultation->id}",
                        'notes' => $data['payment']['notes'] ?? "Cobro directo de consulta #{$consultation->id}",
                        'idempotency_key' => 'payment:consultation:'.$consultation->id,
                    ];
                    $this->paymentService->register($paymentPayload, $companyId, $userId);
                }
            }

            // 4. Actualizar estado y sellar consulta
            $consultation->update([
                'status' => 'completed',
                'warehouse_id' => $warehouseId,
                'invoice_id' => $invoice?->id,
                'finalized_at' => now(),
                'finalized_by' => $userId,
                'idempotency_key' => $data['idempotency_key'] ?? $consultation->idempotency_key,
            ]);

            return $consultation->load([
                'patient.client', 'service', 'vet', 'diagnoses',
                'items.product', 'items.stockMovement', 'invoice.accountReceivable.payments', 'warehouse',
            ]);
        });
    }
}
