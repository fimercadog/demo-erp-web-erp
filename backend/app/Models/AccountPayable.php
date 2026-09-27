<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AccountPayable extends Model
{
    protected $table = 'accounts_payable';

    protected $fillable = [
        'company_id', 'supplier_id', 'purchase_order_id', 'purchase_receipt_id',
        'original_amount', 'paid_amount', 'balance', 'due_date', 'status',
        'three_way_match_status',
    ];

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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceipt::class, 'purchase_receipt_id');
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
