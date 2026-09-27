<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'branch_id' => $this->branch_id,
            'client_id' => $this->client_id,
            'subscription_plan_id' => $this->subscription_plan_id,
            'subscription_number' => $this->subscription_number,
            'status' => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'next_billing_date' => $this->next_billing_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'auto_renew' => $this->auto_renew,
            'last_billed_at' => $this->last_billed_at?->toIso8601String(),
            'amount' => (float) $this->amount,
            'notes' => $this->notes,
            'plan' => new SubscriptionPlanResource($this->whenLoaded('plan')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
