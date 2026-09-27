<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    protected $table = 'journal_entries';

    protected $fillable = [
        'company_id',
        'entry_number',
        'date',
        'concept',
        'reference',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class, 'journal_entry_id');
    }

    public function getTotalDebitAttribute(): float
    {
        return (float) $this->items->sum('debit');
    }

    public function getTotalCreditAttribute(): float
    {
        return (float) $this->items->sum('credit');
    }

    public function getIsBalancedAttribute(): bool
    {
        return abs($this->total_debit - $this->total_credit) < 0.001;
    }
}
