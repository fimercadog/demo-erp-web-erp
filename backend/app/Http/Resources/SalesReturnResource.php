<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'invoice_id' => $this->invoice_id,
            'invoice_number' => $this->invoice?->number,
            'client_id' => $this->client_id,
            'client_name' => $this->client?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'credit_note_id' => $this->credit_note_id,
            'credit_note_number' => $this->creditNote?->number,
            'number' => $this->number,
            'return_type' => $this->return_type,
            'condition' => $this->condition,
            'reason' => $this->reason,
            'status' => $this->status,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'items' => $this->items,
            'created_at' => $this->created_at,
        ];
    }
}
