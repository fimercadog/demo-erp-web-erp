<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountChart extends Model
{
    protected $table = 'account_charts';

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'type',
        'parent_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(AccountChart::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(AccountChart::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class, 'account_chart_id');
    }
}
