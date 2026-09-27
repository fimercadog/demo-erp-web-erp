<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    protected $fillable = [
        'company_id', 'user_id', 'direction', 'paid_at', 'amount', 'method',
        'reference', 'notes', 'payable_type', 'payable_id',
        'cash_session_id', 'cash_movement_id', 'idempotency_key',
    ];

    protected $casts = [
        'paid_at' => 'date',
        'amount' => 'decimal:2',
    ];

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function cashMovement(): BelongsTo
    {
        return $this->belongsTo(CashMovement::class);
    }

    public function reconciliation(): MorphOne
    {
        return $this->morphOne(BankReconciliation::class, 'reconcilable');
    }
}
