<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $clientName = null;
        $clientId = $this->client_id;

        if ($this->relationLoaded('client') && $this->client) {
            $clientName = $this->client->name;
        } elseif ($this->relationLoaded('patient') && $this->patient?->relationLoaded('client') && $this->patient->client) {
            $clientId = $this->patient->client_id;
            $clientName = $this->patient->client->name;
        }

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch?->name),
            'patient_id' => $this->patient_id,
            'patient' => $this->whenLoaded('patient', fn () => $this->patient?->name),
            'species' => $this->whenLoaded('patient', fn () => $this->patient?->species?->name),
            'client_id' => $clientId,
            'client' => $clientName,
            'service_id' => $this->service_id,
            'service' => $this->whenLoaded('service', fn () => $this->service?->name),
            'practitioner_id' => $this->practitioner_id,
            'practitioner' => $this->whenLoaded('practitioner', fn () => $this->practitioner?->name),
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'duration_minutes' => $this->duration_minutes,
            // OJO: `$this->resource` es la propiedad interna de JsonResource (el
            // modelo envuelto), no la columna. Hay que leer el atributo a mano.
            'resource' => $this->getAttribute('resource'),
            'reason' => $this->reason,
            'status' => $this->status,
            'price' => (float) $this->price,
            'payment_status' => $this->payment_status ?? 'unpaid',
            'reminder_sent' => (bool) $this->reminder_sent,
            'cancellation_reason' => $this->cancellation_reason,
            'invoice_id' => $this->invoice_id,
            'account_receivable_id' => $this->account_receivable_id,
            'notes' => $this->notes,
        ];
    }
}
