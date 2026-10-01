<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Procedure extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id', 'patient_id', 'service_id', 'consultation_id', 'vet_id', 'type',
        'price', 'status', 'performed_at', 'notes', 'consent_document_url',
    ];

    protected function casts(): array
    {
        return [
            'performed_at' => 'date',
            'price' => 'decimal:2',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function vet(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vet_id');
    }

    public function practitioner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vet_id');
    }
}
