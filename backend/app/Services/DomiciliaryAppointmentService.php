<?php

namespace App\Services;

use App\Models\AccountReceivable;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Service;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DomiciliaryAppointmentService
{
    /**
     * Book a domiciliary IV appointment.
     */
    public function bookDomiciliary(array $data): Appointment
    {
        $companyId = $data['company_id'];

        $service = Service::where('company_id', $companyId)->findOrFail($data['service_id']);

        $startsAt = Carbon::parse($data['starts_at']);
        $duration = $service->estimated_duration_minutes ?? 45;
        $endsAt = $startsAt->copy()->addMinutes($duration);

        // Find or create Client
        $client = null;
        if (! empty($data['client_id'])) {
            $client = Client::where('company_id', $companyId)->find($data['client_id']);
        }

        if (! $client && ! empty($data['email'])) {
            $client = Client::firstOrCreate(
                ['company_id' => $companyId, 'email' => $data['email']],
                [
                    'name' => $data['client_name'] ?? 'Cliente Domiciliario',
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'status' => 'active',
                ]
            );
        }

        // Find or create Patient
        $patient = null;
        if (! empty($data['patient_id'])) {
            $patient = Patient::where('company_id', $companyId)->find($data['patient_id']);
        }

        if (! $patient && $client) {
            $patient = Patient::firstOrCreate(
                ['company_id' => $companyId, 'client_id' => $client->id, 'name' => $client->name],
                [
                    'phone' => $client->phone,
                    'address' => $data['address'] ?? $client->address,
                    'status' => 'active',
                ]
            );
        }

        $appointment = Appointment::create([
            'company_id' => $companyId,
            'client_id' => $client?->id,
            'patient_id' => $patient?->id,
            'service_id' => $service->id,
            'practitioner_id' => $data['practitioner_id'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'duration_minutes' => $duration,
            'price' => $data['price'] ?? $service->price,
            'reason' => $data['reason'] ?? "Sueroterapia a domicilio ({$service->name})",
            'status' => 'scheduled',
            'payment_status' => $data['payment_status'] ?? 'unpaid',
            'notes' => $data['notes'] ?? null,
            'is_domiciliary' => true,
            'address' => $data['address'],
            'city' => $data['city'] ?? Company::where('id', $companyId)->value('city') ?? 'Bogotá',
            'neighborhood' => $data['neighborhood'] ?? null,
            'address_reference' => $data['address_reference'] ?? null,
            'dispatch_status' => ! empty($data['practitioner_id']) ? 'assigned' : 'pending',
        ]);

        return $appointment->load(['client', 'patient', 'service', 'practitioner']);
    }

    /**
     * Update dispatch status of a domiciliary appointment.
     */
    public function updateDispatchStatus(int $appointmentId, string $dispatchStatus, ?int $practitionerId = null, ?string $notes = null): Appointment
    {
        $validStatuses = ['pending', 'assigned', 'en_route', 'arrived', 'completed'];
        if (! in_array($dispatchStatus, $validStatuses, true)) {
            throw ValidationException::withMessages([
                'dispatch_status' => ['Estado de despacho a domicilio no válido.'],
            ]);
        }

        $appointment = Appointment::findOrFail($appointmentId);

        $updates = ['dispatch_status' => $dispatchStatus];

        if ($practitionerId) {
            $updates['practitioner_id'] = $practitionerId;
        }

        if ($notes) {
            $updates['notes'] = trim(($appointment->notes ? $appointment->notes . ' | ' : '') . $notes);
        }

        if ($dispatchStatus === 'completed') {
            $updates['status'] = 'attended';
        }

        $appointment->update($updates);

        return $appointment->load(['client', 'patient', 'service', 'practitioner']);
    }

    /**
     * Register IV Therapy execution with consumable inventory deduction.
     */
    public function executeInfusionTherapy(int $appointmentId, array $consumables = []): array
    {
        return DB::transaction(function () use ($appointmentId, $consumables) {
            $appointment = Appointment::with(['client', 'service'])->findOrFail($appointmentId);
            $companyId = $appointment->company_id;

            // Mark as completed
            $appointment->update([
                'dispatch_status' => 'completed',
                'status' => 'attended',
            ]);

            // Deduct stock for consumables used (e.g. Saline Solution, IV kit)
            $warehouse = Warehouse::where('company_id', $companyId)->first();
            $deductedItems = [];

            if ($warehouse && ! empty($consumables)) {
                foreach ($consumables as $item) {
                    $product = Product::where('company_id', $companyId)->find($item['product_id']);
                    if (! $product) {
                        continue;
                    }

                    $qty = (int) ($item['quantity'] ?? 1);

                    StockMovement::create([
                        'company_id' => $companyId,
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'type' => 'out',
                        'quantity' => -$qty,
                        'reason' => "Consumo kit sueroterapia domicilio (Cita #{$appointment->id})",
                        'reference' => 'appointment:' . $appointment->id,
                    ]);

                    $deductedItems[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $qty,
                    ];
                }
            }

            // Create Invoice if not already invoiced
            $invoice = null;
            if (! $appointment->invoice_id && $appointment->client_id) {
                $servicePrice = (float) ($appointment->price ?? $appointment->service->price ?? 0);

                $invoice = Invoice::create([
                    'company_id' => $companyId,
                    'client_id' => $appointment->client_id,
                    'number' => 'INV-' . strtoupper(uniqid()),
                    'issue_date' => now()->toDateString(),
                    'due_date' => now()->toDateString(),
                    'status' => 'paid',
                    'subtotal' => $servicePrice,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => $servicePrice,
                    'notes' => "Factura por atención sueroterapia a domicilio (Cita #{$appointment->id})",
                ]);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_name' => $appointment->service->name ?? 'Sueroterapia a Domicilio',
                    'quantity' => 1,
                    'unit_price' => $servicePrice,
                    'line_total' => $servicePrice,
                ]);

                $appointment->update([
                    'invoice_id' => $invoice->id,
                    'payment_status' => 'paid',
                ]);
            }

            return [
                'appointment' => $appointment->fresh(['client', 'service', 'practitioner', 'invoice']),
                'inventory_deducted' => $deductedItems,
                'invoice' => $invoice,
            ];
        });
    }

    /**
     * Get list of domiciliary appointments filtered by status or date.
     */
    public function getDomiciliaryList(int $companyId, ?string $date = null, ?string $dispatchStatus = null)
    {
        $query = Appointment::with(['client', 'patient', 'service', 'practitioner'])
            ->where('company_id', $companyId)
            ->where('is_domiciliary', true);

        if ($date) {
            $query->whereDate('starts_at', $date);
        }

        if ($dispatchStatus) {
            $query->where('dispatch_status', $dispatchStatus);
        }

        return $query->orderBy('starts_at', 'asc')->get();
    }
}
