<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CashMovement extends Model
{
    protected $fillable = [
        'company_id', 'cash_session_id', 'user_id', 'type', 'amount', 'method',
        'reference', 'notes', 'source_type', 'source_id', 'idempotency_key',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(CashSession::class, 'cash_session_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function reconciliation(): MorphOne
    {
        return $this->morphOne(BankReconciliation::class, 'reconcilable');
    }
}
