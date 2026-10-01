<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient?->id,
                'name' => $this->patient?->name,
                'client_id' => $this->patient?->client_id,
                'client' => $this->patient?->client?->name,
                'species' => $this->patient?->species?->name,
                'breed' => $this->patient?->breed?->name,
            ]),
            'appointment_id' => $this->appointment_id,
            'vet_id' => $this->vet_id,
            'vet' => $this->whenLoaded('vet', fn () => $this->vet?->name),
            'service_id' => $this->service_id,
            'service' => $this->whenLoaded('service', fn () => $this->service?->name),
            'date' => $this->date?->toDateString(),
            'reason' => $this->reason,
            'status' => $this->status ?? 'open',
            'price' => (float) ($this->price ?? 0),
            'invoice_id' => $this->invoice_id,
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id' => $this->invoice?->id,
                'number' => $this->invoice?->number,
                'status' => $this->invoice?->status,
                'total' => (float) $this->invoice?->total,
                'account_receivable' => $this->invoice?->accountReceivable ? [
                    'id' => $this->invoice->accountReceivable->id,
                    'balance' => (float) $this->invoice->accountReceivable->balance,
                    'status' => $this->invoice->accountReceivable->status,
                ] : null,
            ]),
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse?->name),
            'finalized_at' => $this->finalized_at,
            'weight' => $this->weight,
            'temperature' => $this->temperature,
            'subjective' => $this->subjective,
            'objective' => $this->objective,
            'assessment' => $this->assessment,
            'plan' => $this->plan,
            'diagnoses' => $this->whenLoaded('diagnoses', fn () => $this->diagnoses->map(fn ($d) => [
                'id' => $d->id, 'name' => $d->name, 'code' => $d->code,
            ])),
            'items' => ConsultationItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
