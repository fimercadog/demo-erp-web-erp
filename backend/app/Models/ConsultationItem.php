<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationItem extends Model
{
    protected $fillable = [
        'company_id', 'consultation_id', 'item_type', 'product_id', 'service_id', 'procedure_id',
        'name', 'quantity', 'unit_price', 'unit_cost', 'is_billable', 'is_inventoriable',
        'stock_movement_id', 'notes',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'is_billable' => 'boolean',
        'is_inventoriable' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function procedure(): BelongsTo
    {
        return $this->belongsTo(Procedure::class);
    }

    public function stockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class);
    }

    public function lineTotal(): float
    {
        if (! $this->is_billable) {
            return 0.0;
        }

        return round((float) $this->quantity * (float) $this->unit_price, 2);
    }
}
