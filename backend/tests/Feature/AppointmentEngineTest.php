<?php

namespace Tests\Feature;

use App\Models\AccountReceivable;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AppointmentEngineTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Client $client;

    private Service $service;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Citas Core Test SA']);
        Permission::firstOrCreate(['name' => 'appointments.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('appointments.manage');
        Sanctum::actingAs($this->user, ['*']);

        $this->branch = Branch::create([
            'company_id' => $this->company->id,
            'code' => 'SED-01',
            'name' => 'Sede Principal',
            'is_main' => true,
        ]);

        $this->client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Alumno / Cliente General',
            'email' => 'cliente@test.com',
        ]);

        $this->service = Service::create([
            'company_id' => $this->company->id,
            'name' => 'Clase de Entrenamiento / Sesión',
            'type' => 'consulta',
            'estimated_duration_minutes' => 60,
            'price' => 80000,
            'status' => 'active',
        ]);
    }

    public function test_creates_appointment_directly_for_client_without_patient(): void
    {
        $startsAt = Carbon::tomorrow()->setTime(10, 0);

        $response = $this->postJson('/api/appointments', [
            'client_id' => $this->client->id,
            'branch_id' => $this->branch->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->user->id,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $startsAt->copy()->addMinutes(60)->toDateTimeString(),
            'resource' => 'Cancha 1',
            'price' => 80000,
            'reason' => 'Entrenamiento de prueba',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.client_id', $this->client->id)
            ->assertJsonPath('data.branch_id', $this->branch->id)
            ->assertJsonPath('data.price', 80000)
            ->assertJsonPath('data.resource', 'Cancha 1');

        $this->assertDatabaseHas('appointments', [
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'patient_id' => null,
            'resource' => 'Cancha 1',
            'price' => 80000.00,
        ]);
    }

    public function test_prevents_double_booking_by_practitioner_or_resource(): void
    {
        $startsAt = Carbon::tomorrow()->setTime(14, 0);
        $endsAt = Carbon::tomorrow()->setTime(15, 0);

        // Create first appointment for resource "Cancha 2"
        Appointment::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->user->id,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $endsAt->toDateTimeString(),
            'resource' => 'Cancha 2',
            'status' => 'confirmed',
        ]);

        // Attempting to create overlapping appointment for the same practitioner
        $response = $this->postJson('/api/appointments', [
            'client_id' => $this->client->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->user->id,
            'starts_at' => $startsAt->copy()->addMinutes(15)->toDateTimeString(),
            'ends_at' => $endsAt->copy()->addMinutes(15)->toDateTimeString(),
        ]);

        $response->assertStatus(422);
    }

    public function test_reschedule_appointment_checks_availability(): void
    {
        $startsAt = Carbon::tomorrow()->setTime(9, 0);

        $appt = Appointment::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->user->id,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $startsAt->copy()->addMinutes(60)->toDateTimeString(),
            'status' => 'scheduled',
        ]);

        $newStartsAt = Carbon::tomorrow()->setTime(16, 0);

        $response = $this->postJson("/api/appointments/{$appt->id}/reschedule", [
            'starts_at' => $newStartsAt->toDateTimeString(),
        ]);

        $response->assertOk();

        $appt->refresh();
        $this->assertSame($newStartsAt->toDateTimeString(), $appt->starts_at->toDateTimeString());
    }

    public function test_mark_attended_with_auto_billing_generates_invoice_and_cxc(): void
    {
        $startsAt = Carbon::yesterday()->setTime(11, 0);

        $appt = Appointment::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'service_id' => $this->service->id,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $startsAt->copy()->addMinutes(60)->toDateTimeString(),
            'price' => 80000,
            'status' => 'confirmed',
        ]);

        $response = $this->postJson("/api/appointments/{$appt->id}/attended", [
            'auto_bill' => true,
        ]);

        $response->assertOk();

        $appt->refresh();
        $this->assertSame('attended', $appt->status);
        $this->assertNotNull($appt->invoice_id);
        $this->assertNotNull($appt->account_receivable_id);

        $this->assertDatabaseHas('invoices', [
            'id' => $appt->invoice_id,
            'client_id' => $this->client->id,
            'total' => 80000.00,
        ]);

        $this->assertDatabaseHas('accounts_receivable', [
            'id' => $appt->account_receivable_id,
            'client_id' => $this->client->id,
            'original_amount' => 80000.00,
        ]);
    }
}
