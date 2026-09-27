<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Company;
use App\Models\Product;
use App\Models\Service;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SueroterapiaTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private User $nurse;
    private Service $service;
    private Product $salineProduct;
    private Warehouse $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'VITA INFUSION S.A.S. (Demo)']);
        $this->warehouse = Warehouse::create([
            'company_id' => $this->company->id,
            'name' => 'Bodega Central de Insumos',
        ]);

        $this->service = Service::create([
            'company_id' => $this->company->id,
            'name' => 'Suero Inmunoboost (Demo)',
            'type' => 'procedimiento',
            'price' => 180000,
            'estimated_duration_minutes' => 45,
            'status' => 'active',
        ]);

        $this->salineProduct = Product::create([
            'company_id' => $this->company->id,
            'name' => 'Solución Salina 0.9% 500ml',
            'sku' => 'SUERO-SAL-500',
            'cost_price' => 4500,
            'unit_price' => 12000,
            'status' => 'active',
        ]);

        // Stock initial
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->salineProduct->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'in',
            'quantity' => 100,
            'reason' => 'Stock inicial de insumos',
        ]);

        Permission::firstOrCreate(['name' => 'appointments.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('appointments.manage');

        $this->nurse = User::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Enfermero Pedro Gómez (Demo)',
        ]);

        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_public_can_book_domiciliary_iv_therapy(): void
    {
        $payload = [
            'service_id' => $this->service->id,
            'client_name' => 'Carlos Mendoza (Demo)',
            'email' => 'carlos.mendoza.demo@example.com',
            'phone' => '+57 310 555 9988',
            'address' => 'Calle 93 #14-20',
            'city' => 'Bogotá',
            'neighborhood' => 'Chicó',
            'address_reference' => 'Apto 502, Torre 2',
            'starts_at' => now()->addDays(2)->setTime(10, 0)->toIso8601String(),
            'notes' => 'Requiere atención con catéter suave',
            'consent' => true,
        ];

        $response = $this->postJson('/api/public/domiciliary/book', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.address', 'Calle 93 #14-20');
        $response->assertJsonPath('data.neighborhood', 'Chicó');
        $response->assertJsonPath('data.dispatch_status', 'pending');

        $this->assertDatabaseHas('appointments', [
            'company_id' => $this->company->id,
            'is_domiciliary' => true,
            'address' => 'Calle 93 #14-20',
            'neighborhood' => 'Chicó',
            'dispatch_status' => 'pending',
        ]);
    }

    public function test_admin_can_update_dispatch_status(): void
    {
        $appointment = Appointment::create([
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
            'starts_at' => now()->addHours(3),
            'ends_at' => now()->addHours(4),
            'is_domiciliary' => true,
            'address' => 'Cra 7 #127-33',
            'city' => 'Bogotá',
            'neighborhood' => 'Santa Ana',
            'dispatch_status' => 'pending',
            'status' => 'scheduled',
        ]);

        // Assign nurse & set status to en_route
        $response = $this->postJson("/api/domiciliary-appointments/{$appointment->id}/dispatch", [
            'dispatch_status' => 'en_route',
            'practitioner_id' => $this->nurse->id,
            'notes' => 'Enfermero en camino en moto de servicio',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.dispatch_status', 'en_route');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'practitioner_id' => $this->nurse->id,
            'dispatch_status' => 'en_route',
        ]);
    }

    public function test_executes_therapy_and_deducts_consumable_stock(): void
    {
        $client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Mariana Restrepo (Demo)',
            'email' => 'mariana.demo@example.com',
        ]);

        $appointment = Appointment::create([
            'company_id' => $this->company->id,
            'client_id' => $client->id,
            'service_id' => $this->service->id,
            'practitioner_id' => $this->nurse->id,
            'starts_at' => now()->subHour(),
            'ends_at' => now(),
            'price' => 180000,
            'is_domiciliary' => true,
            'address' => 'Calle 100 #19-54',
            'neighborhood' => 'Rosales',
            'dispatch_status' => 'arrived',
            'status' => 'scheduled',
        ]);

        $response = $this->postJson("/api/domiciliary-appointments/{$appointment->id}/execute", [
            'consumables' => [
                ['product_id' => $this->salineProduct->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.appointment.dispatch_status', 'completed');
        $response->assertJsonPath('data.appointment.status', 'attended');

        // Check stock movement created
        $this->assertDatabaseHas('stock_movements', [
            'company_id' => $this->company->id,
            'product_id' => $this->salineProduct->id,
            'quantity' => -2,
            'type' => 'out',
        ]);

        // Check invoice generated
        $this->assertDatabaseHas('invoices', [
            'company_id' => $this->company->id,
            'client_id' => $client->id,
            'status' => 'paid',
            'total' => 180000,
        ]);
    }

    public function test_domiciliary_appointments_isolated_by_company(): void
    {
        $otherCompany = Company::create(['name' => 'Otra Empresa SA (Demo)']);

        Appointment::create([
            'company_id' => $otherCompany->id,
            'service_id' => $this->service->id,
            'starts_at' => now(),
            'ends_at' => now()->addHour(),
            'is_domiciliary' => true,
            'address' => 'Calle Falsa 123',
            'dispatch_status' => 'pending',
        ]);

        $response = $this->getJson('/api/domiciliary-appointments');
        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }
}
