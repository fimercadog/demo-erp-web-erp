<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BankReconciliation extends Model
{
    protected $table = 'bank_reconciliations';

    protected $fillable = [
        'company_id',
        'bank_statement_item_id',
        'reconcilable_type',
        'reconcilable_id',
        'match_type',
        'amount_difference',
        'notes',
        'reconciled_by',
        'reconciled_at',
    ];

    protected $casts = [
        'amount_difference' => 'decimal:2',
        'reconciled_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function statementItem(): BelongsTo
    {
        return $this->belongsTo(BankStatementItem::class, 'bank_statement_item_id');
    }

    public function reconcilable(): MorphTo
    {
        return $this->morphTo();
    }

    public function reconciler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }
}
