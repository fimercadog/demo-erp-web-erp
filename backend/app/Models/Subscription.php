<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    protected $fillable = [
        'company_id',
        'branch_id',
        'client_id',
        'subscription_plan_id',
        'subscription_number',
        'status',
        'start_date',
        'next_billing_date',
        'end_date',
        'auto_renew',
        'last_billed_at',
        'amount',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'next_billing_date' => 'date',
        'end_date' => 'date',
        'last_billed_at' => 'datetime',
        'amount' => 'decimal:2',
        'auto_renew' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
