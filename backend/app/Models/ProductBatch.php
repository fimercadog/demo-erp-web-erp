<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductBatch extends Model
{
    protected $fillable = [
        'company_id',
        'product_id',
        'warehouse_id',
        'supplier_id',
        'purchase_receipt_id',
        'batch_number',
        'manufacturing_date',
        'expiration_date',
        'initial_quantity',
        'current_quantity',
        'unit_cost',
        'status',
        'notes',
    ];

    protected $casts = [
        'manufacturing_date' => 'date',
        'expiration_date' => 'date',
        'initial_quantity' => 'integer',
        'current_quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    protected $appends = ['is_expired', 'is_near_expiration', 'days_until_expiration', 'computed_status'];

    public function getIsExpiredAttribute(): bool
    {
        if (! $this->expiration_date || $this->current_quantity <= 0) {
            return false;
        }

        return $this->expiration_date->isPast() && ! $this->expiration_date->isToday();
    }

    public function getIsNearExpirationAttribute(): bool
    {
        if (! $this->expiration_date || $this->is_expired || $this->current_quantity <= 0) {
            return false;
        }

        $daysLeft = now()->startOfDay()->diffInDays($this->expiration_date, false);

        return $daysLeft >= 0 && $daysLeft <= 30;
    }

    public function getDaysUntilExpirationAttribute(): ?int
    {
        if (! $this->expiration_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->expiration_date, false);
    }

    public function getComputedStatusAttribute(): string
    {
        if ($this->current_quantity <= 0) {
            return 'depleted';
        }

        if ($this->is_expired) {
            return 'expired';
        }

        if ($this->is_near_expiration) {
            return 'near_expiration';
        }

        return 'active';
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseReceipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_batch_id');
    }
}
