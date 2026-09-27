<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankStatement extends Model
{
    protected $table = 'bank_statements';

    protected $fillable = [
        'company_id',
        'bank_name',
        'account_number',
        'file_name',
        'start_date',
        'end_date',
        'total_items',
        'total_debits',
        'total_credits',
        'status',
        'imported_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_debits' => 'decimal:2',
        'total_credits' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BankStatementItem::class, 'bank_statement_id');
    }
}
