<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->name,
            'purchase_receipt_id' => $this->purchase_receipt_id,
            'batch_number' => $this->batch_number,
            'manufacturing_date' => $this->manufacturing_date?->toDateString(),
            'expiration_date' => $this->expiration_date?->toDateString(),
            'initial_quantity' => $this->initial_quantity,
            'current_quantity' => $this->current_quantity,
            'unit_cost' => $this->unit_cost,
            'status' => $this->computed_status ?? $this->status,
            'is_expired' => $this->is_expired,
            'is_near_expiration' => $this->is_near_expiration,
            'days_until_expiration' => $this->days_until_expiration,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
