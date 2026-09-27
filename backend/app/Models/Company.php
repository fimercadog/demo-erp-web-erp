<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'nit',
        'email',
        'phone',
        'address',
        'city',
        'logo',
        'timezone',
        'locale',
        'currency',
        'date_format',
        'work_start_time',
        'late_grace_minutes',
        'vertical',
        'status',
    ];

    public function branches(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Branch::class);
    }
}
