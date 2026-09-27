<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AccountReceivable extends Model
{
    protected $table = 'accounts_receivable';

    protected $fillable = ['company_id', 'client_id', 'invoice_id', 'original_amount', 'paid_amount', 'balance', 'due_date', 'status'];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'due_date' => 'date',
    ];

    protected $appends = ['is_overdue', 'days_overdue'];

    public function getIsOverdueAttribute(): bool
    {
        if ((float) $this->balance <= 0 || ! $this->due_date) {
            return false;
        }

        return $this->due_date->isPast() && ! $this->due_date->isToday();
    }

    public function getDaysOverdueAttribute(): int
    {
        if (! $this->is_overdue || ! $this->due_date) {
            return 0;
        }

        return (int) $this->due_date->diffInDays(now()->startOfDay());
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
