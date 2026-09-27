<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountReceivableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'invoice_id' => $this->invoice_id,
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice?->number),
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
