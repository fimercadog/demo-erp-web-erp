<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'code',
        'description',
        'price',
        'billing_frequency',
        'grace_days',
        'auto_renew',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'grace_days' => 'integer',
        'auto_renew' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
