<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'purchase_order_id' => $this->purchase_order_id,
            'purchase_receipt_id' => $this->purchase_receipt_id,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'number' => $this->number,
            'reason' => $this->reason,
            'status' => $this->status,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'items' => $this->items,
            'created_at' => $this->created_at,
        ];
    }
}
