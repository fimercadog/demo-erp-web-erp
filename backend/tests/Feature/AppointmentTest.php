<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Company;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Species;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * S5 — Citas / Agenda. `Appointment` lleva `patient_id` (no `client_id`): el
 * propietario se navega vía patient.
 */
class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Patient $patient;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create(['name' => fake()->company()]);
        foreach (['appointments.manage', 'services.manage'] as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $user = User::factory()->create(['company_id' => $this->company->id]);
        $user->givePermissionTo(['appointments.manage', 'services.manage']);
        Sanctum::actingAs($user, ['*']);

        $client = Client::factory()->create(['company_id' => $this->company->id]);
        $species = Species::create(['company_id' => $this->company->id, 'name' => 'Perro', 'status' => 'active']);
        $this->patient = Patient::query()->create([
            'company_id' => $this->company->id, 'client_id' => $client->id, 'species_id' => $species->id,
            'name' => 'Luna', 'sex' => 'female', 'status' => 'active',
        ]);
        $this->service = Service::create([
            'company_id' => $this->company->id, 'name' => 'Consulta general', 'type' => 'consulta',
            'estimated_duration_minutes' => 30, 'price' => 45000, 'status' => 'active',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'patient_id' => $this->patient->id,
            'service_id' => $this->service->id,
            'starts_at' => now()->addDay()->setTime(9, 0)->toDateTimeString(),
            'ends_at' => now()->addDay()->setTime(9, 30)->toDateTimeString(),
            'reason' => 'Control',
        ], $overrides);
    }

    public function test_creates_an_appointment_and_resolves_the_owner_via_patient(): void
    {
        $this->postJson('/api/appointments', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.patient', 'Luna')
            ->assertJsonPath('data.client', $this->patient->client->name)
            ->assertJsonPath('data.duration_minutes', 30)
            ->assertJsonPath('data.status', 'scheduled');
    }

    public function test_appointments_table_has_nullable_client_id_column(): void
    {
        $this->assertTrue(
            Schema::hasColumn('appointments', 'client_id'),
            'appointments debe soportar client_id para citas transversales de clientes',
        );
    }

    public function test_ends_at_must_be_after_starts_at(): void
    {
        $this->postJson('/api/appointments', $this->payload([
            'starts_at' => now()->addDay()->setTime(10, 0)->toDateTimeString(),
            'ends_at' => now()->addDay()->setTime(9, 0)->toDateTimeString(),
        ]))->assertStatus(422)->assertJsonValidationErrors('ends_at');
    }

    public function test_rejects_a_non_date_starts_at(): void
    {
        // El form del panel captura la fecha como texto con patrón; el backend
        // es la garantía de que no entren valores basura a la columna dateTime.
        $this->postJson('/api/appointments', $this->payload([
            'starts_at' => 'no soy una fecha',
            'ends_at' => 'tampoco',
        ]))->assertStatus(422)->assertJsonValidationErrors(['starts_at', 'ends_at']);
    }

    public function test_patient_must_belong_to_the_company(): void
    {
        $foreignPatient = Patient::query()->create([
            'company_id' => Company::factory()->create(['name' => fake()->company()])->id,
            'client_id' => Client::factory()->create(['company_id' => $this->company->id])->id,
            'species_id' => Species::create(['company_id' => $this->company->id, 'name' => 'Gato', 'status' => 'active'])->id,
            'name' => 'Ajeno', 'sex' => 'unknown', 'status' => 'active',
        ]);

        $this->postJson('/api/appointments', $this->payload(['patient_id' => $foreignPatient->id]))
            ->assertStatus(422)->assertJsonValidationErrors('patient_id');
    }

    public function test_state_transitions(): void
    {
        $id = $this->postJson('/api/appointments', $this->payload())->json('data.id');

        $this->postJson("/api/appointments/{$id}/confirm")->assertOk()->assertJsonPath('data.status', 'confirmed');
        $this->postJson("/api/appointments/{$id}/attended")->assertOk()->assertJsonPath('data.status', 'attended');
        // Ya atendida: no se puede cancelar.
        $this->postJson("/api/appointments/{$id}/cancel")->assertStatus(422);
    }

    public function test_index_filters_by_date_range_on_starts_at(): void
    {
        $this->postJson('/api/appointments', $this->payload([
            'starts_at' => now()->addDays(1)->setTime(9, 0)->toDateTimeString(),
            'ends_at' => now()->addDays(1)->setTime(9, 30)->toDateTimeString(),
        ]))->assertCreated();
        $this->postJson('/api/appointments', $this->payload([
            'starts_at' => now()->addDays(10)->setTime(9, 0)->toDateTimeString(),
            'ends_at' => now()->addDays(10)->setTime(9, 30)->toDateTimeString(),
        ]))->assertCreated();

        $from = now()->addDays(1)->toDateString();
        $to = now()->addDays(2)->toDateString();
        $data = $this->getJson("/api/appointments?date_from={$from}&date_to={$to}")->assertOk()->json('data');

        $this->assertCount(1, $data);
    }

    public function test_cannot_delete_a_service_in_use_by_an_appointment(): void
    {
        $this->postJson('/api/appointments', $this->payload())->assertCreated();

        $this->deleteJson("/api/services/{$this->service->id}")->assertStatus(422);
        $this->assertDatabaseHas('services', ['id' => $this->service->id]);
    }

    public function test_status_cannot_be_forced_on_create_or_update(): void
    {
        // En el alta se ignora un status enviado: la cita nace 'scheduled'.
        $id = $this->postJson('/api/appointments', $this->payload(['status' => 'attended']))
            ->assertCreated()->assertJsonPath('data.status', 'scheduled')->json('data.id');

        // Un PUT ignora `status`: solo confirm/cancel/attended/no-show lo mueven.
        $this->putJson("/api/appointments/{$id}", ['status' => 'attended', 'reason' => 'x'])->assertOk();
        $this->assertDatabaseHas('appointments', ['id' => $id, 'status' => 'scheduled']);
    }

    public function test_rejects_a_double_booking_for_the_same_practitioner(): void
    {
        $vet = User::factory()->create(['company_id' => $this->company->id]);

        $this->postJson('/api/appointments', $this->payload([
            'practitioner_id' => $vet->id,
            'starts_at' => now()->addDay()->setTime(9, 0)->toDateTimeString(),
            'ends_at' => now()->addDay()->setTime(9, 30)->toDateTimeString(),
        ]))->assertCreated();

        // Se solapa 15 min con la anterior.
        $this->postJson('/api/appointments', $this->payload([
            'practitioner_id' => $vet->id,
            'starts_at' => now()->addDay()->setTime(9, 15)->toDateTimeString(),
            'ends_at' => now()->addDay()->setTime(9, 45)->toDateTimeString(),
        ]))->assertStatus(422)->assertJsonValidationErrors('practitioner_id');

        // Contiguo (empieza cuando la otra termina): permitido.
        $this->postJson('/api/appointments', $this->payload([
            'practitioner_id' => $vet->id,
            'starts_at' => now()->addDay()->setTime(9, 30)->toDateTimeString(),
            'ends_at' => now()->addDay()->setTime(10, 0)->toDateTimeString(),
        ]))->assertCreated();
    }
}
