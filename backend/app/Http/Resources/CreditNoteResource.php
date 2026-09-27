<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreditNoteResource extends JsonResource
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
            'number' => $this->number,
            'type' => $this->type,
            'reason' => $this->reason,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'tax' => $this->tax,
            'total' => $this->total,
            'restock_inventory' => $this->restock_inventory,
            'notes' => $this->notes,
            'items' => $this->items,
            'created_at' => $this->created_at,
        ];
    }
}
