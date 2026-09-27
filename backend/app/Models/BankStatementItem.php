<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BankStatementItem extends Model
{
    protected $table = 'bank_statement_items';

    protected $fillable = [
        'bank_statement_id',
        'date',
        'concept',
        'reference',
        'amount',
        'type',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function statement(): BelongsTo
    {
        return $this->belongsTo(BankStatement::class, 'bank_statement_id');
    }

    public function reconciliation(): HasOne
    {
        return $this->hasOne(BankReconciliation::class, 'bank_statement_item_id');
    }
}
