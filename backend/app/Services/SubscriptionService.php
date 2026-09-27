<?php

namespace App\Models;

namespace App\Services;

use App\Models\AccountReceivable;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubscriptionService
{
    public function createPlan(array $data): SubscriptionPlan
    {
        return SubscriptionPlan::create($data);
    }

    public function updatePlan(SubscriptionPlan $plan, array $data): SubscriptionPlan
    {
        $plan->update($data);
        return $plan->fresh();
    }

    public function createSubscription(array $data): Subscription
    {
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        if (empty($data['subscription_number'])) {
            $data['subscription_number'] = 'SUB-' . date('Ymd') . '-' . strtoupper(Str::random(5));
        }

        if (empty($data['next_billing_date']) && !empty($data['start_date'])) {
            $data['next_billing_date'] = $data['start_date'];
        }

        if (empty($data['amount']) && !empty($data['subscription_plan_id'])) {
            $plan = SubscriptionPlan::find($data['subscription_plan_id']);
            if ($plan) {
                $data['amount'] = $plan->price;
            }
        }

        return Subscription::create($data);
    }

    public function updateSubscription(Subscription $subscription, array $data): Subscription
    {
        $subscription->update($data);
        return $subscription->fresh();
    }

    public function pauseSubscription(Subscription $subscription): Subscription
    {
        $subscription->update(['status' => 'paused']);
        return $subscription->fresh();
    }

    public function resumeSubscription(Subscription $subscription): Subscription
    {
        $subscription->update(['status' => 'active']);
        return $subscription->fresh();
    }

    public function cancelSubscription(Subscription $subscription): Subscription
    {
        $subscription->update(['status' => 'cancelled']);
        return $subscription->fresh();
    }

    public function calculateNextBillingDate(string $frequency, $fromDate): Carbon
    {
        $date = Carbon::parse($fromDate);

        return match ($frequency) {
            'bimonthly' => $date->addMonths(2),
            'quarterly' => $date->addMonths(3),
            'semi_annual' => $date->addMonths(6),
            'annual' => $date->addYear(),
            default => $date->addMonth(),
        };
    }

    public function processDueSubscriptions(?int $companyId = null, $asOfDate = null): array
    {
        $currentDate = $asOfDate ? Carbon::parse($asOfDate) : Carbon::today();

        $query = Subscription::with(['plan', 'client'])
            ->where('status', 'active')
            ->whereDate('next_billing_date', '<=', $currentDate->toDateString());

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $dueSubscriptions = $query->get();
        $processed = [];

        foreach ($dueSubscriptions as $subscription) {
            DB::transaction(function () use ($subscription, $currentDate, &$processed) {
                $plan = $subscription->plan;
                $graceDays = $plan->grace_days ?? 5;
                $issueDate = $currentDate->toDateString();
                $dueDate = $currentDate->copy()->addDays($graceDays)->toDateString();

                $invoiceNumber = 'INV-SUB-' . date('Ymd') . '-' . strtoupper(Str::random(4));

                $invoice = Invoice::create([
                    'company_id' => $subscription->company_id,
                    'branch_id' => $subscription->branch_id,
                    'client_id' => $subscription->client_id,
                    'subscription_id' => $subscription->id,
                    'number' => $invoiceNumber,
                    'issue_date' => $issueDate,
                    'due_date' => $dueDate,
                    'status' => 'pending',
                    'subtotal' => $subscription->amount,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => $subscription->amount,
                    'notes' => 'Factura de suscripción recurrente #' . $subscription->subscription_number,
                ]);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_name' => 'Suscripción: ' . ($plan->name ?? 'Plan Recurrente'),
                    'quantity' => 1,
                    'unit_price' => $subscription->amount,
                    'discount' => 0,
                    'tax' => 0,
                    'line_total' => $subscription->amount,
                ]);

                AccountReceivable::create([
                    'company_id' => $subscription->company_id,
                    'client_id' => $subscription->client_id,
                    'invoice_id' => $invoice->id,
                    'original_amount' => $subscription->amount,
                    'paid_amount' => 0,
                    'balance' => $subscription->amount,
                    'due_date' => $dueDate,
                    'status' => 'pending',
                ]);

                $nextBillingDate = $this->calculateNextBillingDate(
                    $plan->billing_frequency ?? 'monthly',
                    $subscription->next_billing_date
                );

                $newStatus = 'active';
                if ($subscription->end_date && $nextBillingDate->greaterThan(Carbon::parse($subscription->end_date))) {
                    if (!$subscription->auto_renew) {
                        $newStatus = 'expired';
                    }
                }

                $subscription->update([
                    'last_billed_at' => now(),
                    'next_billing_date' => $nextBillingDate->toDateString(),
                    'status' => $newStatus,
                ]);

                AuditLog::create([
                    'company_id' => $subscription->company_id,
                    'user_id' => auth()->id(),
                    'action' => 'SUBSCRIPTION_BILLED',
                    'module' => 'subscriptions',
                    'entity' => 'Subscription',
                    'entity_id' => $subscription->id,
                    'new_values' => [
                        'invoice_id' => $invoice->id,
                        'invoice_number' => $invoice->number,
                        'amount' => $subscription->amount,
                        'next_billing_date' => $nextBillingDate->toDateString(),
                    ],
                ]);

                $processed[] = [
                    'subscription_id' => $subscription->id,
                    'subscription_number' => $subscription->subscription_number,
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->number,
                    'amount' => $subscription->amount,
                ];
            });
        }

        return $processed;
    }
}
