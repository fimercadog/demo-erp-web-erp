<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Consultation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id', 'patient_id', 'appointment_id', 'vet_id', 'date', 'reason',
        'weight', 'temperature', 'subjective', 'objective', 'assessment', 'plan',
        'status', 'service_id', 'price', 'invoice_id', 'warehouse_id',
        'finalized_at', 'finalized_by', 'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'weight' => 'decimal:2',
            'temperature' => 'decimal:1',
            'price' => 'decimal:2',
            'finalized_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function vet(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vet_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function diagnoses(): BelongsToMany
    {
        return $this->belongsToMany(Diagnosis::class, 'consultation_diagnosis');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ConsultationItem::class);
    }

    public function procedures(): HasMany
    {
        return $this->hasMany(Procedure::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function clinicalApplications(): HasMany
    {
        return $this->hasMany(ClinicalApplication::class);
    }
}
