<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountPayableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'supplier_id' => $this->supplier_id,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'purchase_order_id' => $this->purchase_order_id,
            'purchase_receipt_id' => $this->purchase_receipt_id,
            'original_amount' => $this->original_amount,
            'paid_amount' => $this->paid_amount,
            'balance' => $this->balance,
            'due_date' => $this->due_date?->toDateString(),
            'status' => $this->status,
            'is_overdue' => $this->is_overdue,
            'days_overdue' => $this->days_overdue,
            'created_at' => $this->created_at,
        ];
    }
}
