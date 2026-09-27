<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAppointmentRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $companyId = $this->user()?->company_id;
        $inCompany = fn (string $table) => Rule::exists($table, 'id')->where('company_id', $companyId);

        return [
            'patient_id' => ['required_without:client_id', 'nullable', 'integer', $inCompany('patients')->whereNull('deleted_at')],
            'client_id' => ['required_without:patient_id', 'nullable', 'integer', $inCompany('clients')],
            'branch_id' => ['nullable', 'integer', $inCompany('branches')],
            'service_id' => ['nullable', 'integer', $inCompany('services')],
            'practitioner_id' => ['nullable', 'integer', $inCompany('users')],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'resource' => ['nullable', 'string', 'max:80'],
            'reason' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'string', 'in:unpaid,partially_paid,paid,waived'],
            // `status` NO se acepta acá: una cita nace 'scheduled' (default del
            // modelo) y solo avanza por confirm/cancel/attended/no-show, que
            // validan la transición. Aceptarlo acá saltaría esa máquina.
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Sin doble reserva: un profesional o un box no pueden tener dos citas
     * solapadas (salvo las canceladas / no asistió). Solapan si empiezan antes
     * de que la otra termine y terminan después de que la otra empiece.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty() || ! $this->filled(['starts_at', 'ends_at'])) {
                return;
            }

            $starts = $this->input('starts_at');
            $ends = $this->input('ends_at');
            $companyId = $this->user()?->company_id;

            $clash = fn (string $column, $value) => Appointment::query()
                ->where('company_id', $companyId)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->when($this->route('appointment'), fn ($q, $appt) => $q->whereKeyNot($appt))
                ->where($column, $value)
                ->where('starts_at', '<', $ends)
                ->where('ends_at', '>', $starts)
                ->exists();

            if ($this->filled('practitioner_id') && $clash('practitioner_id', $this->input('practitioner_id'))) {
                $validator->errors()->add('practitioner_id', 'Ese profesional ya tiene una cita en ese horario.');
            }

            if ($this->filled('resource') && $clash('resource', $this->input('resource'))) {
                $validator->errors()->add('resource', 'Ese consultorio ya está ocupado en ese horario.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('duration_minutes')) {
            return;
        }

        $minutes = null;
        if ($this->filled('service_id')) {
            $minutes = Service::query()
                ->where('company_id', $this->user()?->company_id)
                ->where('id', $this->input('service_id'))
                ->value('estimated_duration_minutes');
        }

        if (! $minutes && $this->filled(['starts_at', 'ends_at'])) {
            $minutes = max(1, (int) round(
                (strtotime((string) $this->input('ends_at')) - strtotime((string) $this->input('starts_at'))) / 60
            ));
        }

        $this->merge(['duration_minutes' => $minutes ?: 30]);
    }
}
