<?php

namespace Tests\Feature;

use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Client;
use App\Models\Company;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Service;
use App\Models\Species;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VeterinaryErpIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $vet;

    private Warehouse $warehouse;

    private Patient $patient;

    private Product $medication;

    private Product $supply;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Clínica Veterinaria Los Andes',
            'nit' => '901.245.880-3',
            'email' => 'vet@losandes.test',
        ]);

        $permissions = [
            'medical_records.manage', 'patients.manage', 'services.manage',
            'products.manage', 'stock.manage', 'invoices.manage',
            'accounts_receivable.view', 'payments.manage', 'cash.manage',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $role = Role::firstOrCreate(['name' => 'Veterinario', 'guard_name' => 'web']);
        $role->syncPermissions($permissions);

        $this->vet = User::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Dr. Carlos Medina',
            'email' => 'carlos.vet@losandes.test',
        ]);
        $this->vet->assignRole($role);

        $this->warehouse = Warehouse::create([
            'company_id' => $this->company->id,
            'name' => 'Farmacia / Vitrina',
            'status' => 'active',
        ]);

        $client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Camila Herrera',
            'email' => 'camila@example.com',
            'phone' => '3105550101',
            'status' => 'active',
        ]);

        $species = Species::create([
            'company_id' => $this->company->id,
            'name' => 'Perro',
            'status' => 'active',
        ]);

        $this->patient = Patient::create([
            'company_id' => $this->company->id,
            'client_id' => $client->id,
            'species_id' => $species->id,
            'name' => 'Luna',
            'sex' => 'female',
            'weight' => 28.5,
            'status' => 'active',
        ]);

        $this->service = Service::create([
            'company_id' => $this->company->id,
            'name' => 'Consulta especializada',
            'type' => 'consulta',
            'price' => 80000.00,
            'status' => 'active',
        ]);

        $this->medication = Product::create([
            'company_id' => $this->company->id,
            'sku' => 'MED-MELOX',
            'name' => 'Meloxicam Gotas 10ml',
            'unit_price' => 35000.00,
            'cost_price' => 18000.00,
            'status' => 'active',
        ]);

        $this->supply = Product::create([
            'company_id' => $this->company->id,
            'sku' => 'INS-JER-3ML',
            'name' => 'Jeringa 3ml desechable',
            'unit_price' => 0.00,
            'cost_price' => 450.00,
            'status' => 'active',
        ]);

        // Stock inicial en bodega
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->medication->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 20,
            'reason' => 'Stock inicial',
        ]);
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->supply->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 100,
            'reason' => 'Stock inicial',
        ]);
    }

    public function test_full_veterinary_consultation_cycle_with_stock_and_erp_billing(): void
    {
        // 1. Crear consulta clínica
        $consultationResponse = $this->actingAs($this->vet)->postJson('/api/consultations', [
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'service_id' => $this->service->id,
            'price' => 80000.00,
            'date' => now()->toDateString(),
            'reason' => 'Dolor articular en pata posterior',
            'subjective' => 'Propietaria nota cojera desde ayer.',
            'objective' => 'Dolor a la palpación de rodilla izquierda.',
            'assessment' => 'Esguince leve.',
            'plan' => 'Meloxicam por 5 días y reposo.',
        ]);
        $consultationResponse->assertStatus(201);
        $consultationId = $consultationResponse->json('data.id');

        // 2. Agregar ítem 1: Medicamento cobrable e inventariable (Meloxicam, 1 unidad a $35.000)
        $item1Response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultationId}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => 1,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
            'notes' => '1 frasco para tratamiento en casa',
        ]);
        $item1Response->assertStatus(201);

        // 3. Agregar ítem 2: Insumo clínico inventariable NO cobrable directamente (Jeringa 3ml, 2 unidades a $0)
        $item2Response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultationId}/items", [
            'item_type' => 'supply',
            'product_id' => $this->supply->id,
            'quantity' => 2,
            'unit_price' => 0.00,
            'is_billable' => false,
            'is_inventoriable' => true,
            'notes' => 'Uso en consulta para administración de analgésico inyectable',
        ]);
        $item2Response->assertStatus(201);

        // 4. Finalizar consulta
        $finalizeResponse = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultationId}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $finalizeResponse->assertStatus(200);

        // Verificaciones Clínicas y de Estado
        $this->assertEquals('completed', $finalizeResponse->json('data.status'));
        $this->assertNotNull($finalizeResponse->json('data.finalized_at'));
        $this->assertNotNull($finalizeResponse->json('data.invoice_id'));

        // Verificación de Inventario (Inmutabilidad y Trazabilidad)
        $this->assertEquals(19, $this->medication->stockOnHand($this->warehouse->id));
        $this->assertEquals(98, $this->supply->stockOnHand($this->warehouse->id));

        $medMovement = StockMovement::where('product_id', $this->medication->id)->where('type', 'VENTA')->first();
        $this->assertNotNull($medMovement);
        $this->assertEquals(-1, $medMovement->quantity);

        $supplyMovement = StockMovement::where('product_id', $this->supply->id)->where('type', 'CONSUMO_CLINICO')->first();
        $this->assertNotNull($supplyMovement);
        $this->assertEquals(-2, $supplyMovement->quantity);

        // Verificación de Factura Interna en ERP
        // Consulta ($80.000) + Medicamento ($35.000) = $115.000 total. Insumo de $0 no suma cobro.
        $invoiceId = $finalizeResponse->json('data.invoice_id');
        $invoiceData = $finalizeResponse->json('data.invoice');
        $this->assertEquals('issued', $invoiceData['status']);
        $this->assertEquals(115000.00, $invoiceData['total']);

        // Verificación de Cartera (CxC)
        $this->assertEquals(115000.00, $invoiceData['account_receivable']['balance']);
        $this->assertEquals('pending', $invoiceData['account_receivable']['status']);
    }

    public function test_finalize_consultation_with_immediate_cash_payment(): void
    {
        // 1. Configurar Caja y Sesión abierta
        $register = CashRegister::create([
            'company_id' => $this->company->id,
            'name' => 'Caja Consultorio 1',
            'status' => 'active',
        ]);
        $session = CashSession::create([
            'company_id' => $this->company->id,
            'cash_register_id' => $register->id,
            'opened_by' => $this->vet->id,
            'opened_at' => now(),
            'opening_amount' => 50000.00,
            'expected_amount' => 50000.00,
            'status' => 'open',
        ]);

        // 2. Crear Consulta por $55.000
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'service_id' => $this->service->id,
            'price' => 55000.00,
            'date' => now()->toDateString(),
            'reason' => 'Control post-operatorio',
            'status' => 'open',
        ]);

        // 3. Finalizar con pago inmediato en efectivo
        $response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'payment' => [
                'method' => 'cash',
                'amount' => 55000.00,
                'cash_session_id' => $session->id,
                'reference' => 'Recibo POS-0012',
            ],
        ]);
        $response->assertStatus(200);

        // Verificación: Factura pagada y saldo de CxC en 0
        $invoice = $consultation->refresh()->invoice;
        $this->assertNotNull($invoice);
        $this->assertEquals('paid', $invoice->status);

        $ar = $invoice->accountReceivable;
        $this->assertNotNull($ar);
        $this->assertEquals(0.00, (float) $ar->balance);
        $this->assertEquals('paid', $ar->status);

        // Verificación: Movimiento de caja registrado
        $session->refresh();
        $this->assertEquals(105000.00, (float) $session->expected_amount);
        $this->assertDatabaseHas('cash_movements', [
            'company_id' => $this->company->id,
            'cash_session_id' => $session->id,
            'type' => 'in',
            'amount' => 55000.00,
        ]);
    }

    public function test_insufficient_stock_prevents_finalization(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'date' => now()->toDateString(),
            'reason' => 'Urgencia',
            'status' => 'open',
        ]);

        // Agregar 25 unidades de medicamento cuando solo hay 20 en stock
        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 25,
            'unit_price' => 35000.00,
            'unit_cost' => 18000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        $response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);

        $response->assertStatus(422);
        $this->assertEquals('open', $consultation->refresh()->status);
        $this->assertEquals(20, $this->medication->stockOnHand($this->warehouse->id));
        $this->assertNull($consultation->invoice_id);
    }

    public function test_multitenancy_isolation_blocks_cross_company_access(): void
    {
        $companyB = Company::create([
            'name' => 'Veterinaria del Valle',
            'nit' => '900.888.777-1',
            'email' => 'valle@vet.test',
        ]);
        $vetB = User::factory()->create([
            'company_id' => $companyB->id,
            'name' => 'Dra. Valle',
            'email' => 'dra.valle@vet.test',
        ]);
        $roleB = Role::firstOrCreate(['name' => 'Veterinario B', 'guard_name' => 'web']);
        $roleB->syncPermissions(['medical_records.manage']);
        $vetB->assignRole($roleB);

        $consultationA = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'date' => now()->toDateString(),
            'reason' => 'Consulta confidencial Empresa A',
            'status' => 'open',
        ]);

        // Usuario de Empresa B intenta ver consulta de Empresa A -> 404
        $response = $this->actingAs($vetB)->getJson("/api/consultations/{$consultationA->id}");
        $response->assertStatus(404);

        // Usuario de Empresa B intenta finalizar consulta de Empresa A -> 404
        $finalizeResponse = $this->actingAs($vetB)->postJson("/api/consultations/{$consultationA->id}/finalize", []);
        $finalizeResponse->assertStatus(404);
    }

    public function test_idempotency_prevents_duplicate_finalization(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'price' => 60000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta de control',
            'status' => 'open',
        ]);

        $idempotencyKey = 'unique-finalize-key-12345';

        // Primer intento
        $res1 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'idempotency_key' => $idempotencyKey,
        ]);
        $res1->assertStatus(200);
        $invoiceId1 = $res1->json('data.invoice_id');

        // Segundo intento con la misma llave
        $res2 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'idempotency_key' => $idempotencyKey,
        ]);
        $res2->assertStatus(200);
        $invoiceId2 = $res2->json('data.invoice_id');

        $this->assertEquals($invoiceId1, $invoiceId2);
        $this->assertEquals(1, Consultation::where('company_id', $this->company->id)->where('idempotency_key', $idempotencyKey)->count());
    }
}
