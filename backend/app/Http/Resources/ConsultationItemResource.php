<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'consultation_id' => $this->consultation_id,
            'item_type' => $this->item_type,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product?->name),
            'service_id' => $this->service_id,
            'service' => $this->whenLoaded('service', fn () => $this->service?->name),
            'procedure_id' => $this->procedure_id,
            'name' => $this->name,
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'unit_cost' => (float) $this->unit_cost,
            'is_billable' => (bool) $this->is_billable,
            'is_inventoriable' => (bool) $this->is_inventoriable,
            'line_total' => $this->lineTotal(),
            'stock_movement_id' => $this->stock_movement_id,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
