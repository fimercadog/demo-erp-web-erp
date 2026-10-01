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

class VeterinaryAdversarialVerificationTest extends TestCase
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
            'name' => 'Farmacia Principal',
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

        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->medication->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 100,
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

    /**
     * C-01: Bypass de status=completed
     * Comportamiento seguro esperado: Una consulta en estado 'completed' NO permite:
     * - Agregar nuevos ítems (422)
     * - Eliminar ítems (422)
     * - Modificar campos clínicos vía PUT (422)
     * - Re-finalizar sin idempotency_key (422)
     */
    public function test_c01_bypass_status_completed(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'service_id' => $this->service->id,
            'price' => 80000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta original de control',
            'status' => 'open',
        ]);

        $itemResponse = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => 1,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);
        $itemResponse->assertStatus(201);
        $itemId = $itemResponse->json('data.id');

        // Finalizar consulta
        $finalizeRes = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $finalizeRes->assertStatus(200);
        $this->assertEquals('completed', $consultation->refresh()->status);

        // 1. Intento de agregar item a consulta completada -> Debe ser 422
        $addItemRes = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'supply',
            'product_id' => $this->supply->id,
            'quantity' => 2,
        ]);
        $addItemRes->assertStatus(422);

        // 2. Intento de eliminar item de consulta completada -> Debe ser 422
        $removeItemRes = $this->actingAs($this->vet)->deleteJson("/api/consultations/{$consultation->id}/items/{$itemId}");
        $removeItemRes->assertStatus(422);

        // 3. Intento de editar consulta completada -> Debe ser 422
        $updateRes = $this->actingAs($this->vet)->putJson("/api/consultations/{$consultation->id}", [
            'reason' => 'Intento de modificar razón en consulta finalizada',
        ]);
        $updateRes->assertStatus(422);

        // 4. Intento de re-finalizar consulta completada sin idempotency key -> Debe ser 422
        $reFinalizeRes = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $reFinalizeRes->assertStatus(422);
    }

    /**
     * C-02: Cantidades 0.5, 1.5 y 2.75
     * Comportamiento seguro esperado: El sistema procesa correctamente cantidades decimales
     * (0.5 frascos, 1.5 ml, 2.75 dosis) al agregar items y al finalizar consulta,
     * descontando exactamente el stock decimal y calculando el total de factura proporcional.
     */
    public function test_c02_cantidades_decimales_0_5_1_5_2_75(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'service_id' => $this->service->id,
            'price' => 50000.00,
            'date' => now()->toDateString(),
            'reason' => 'Aplicación fraccionada',
            'status' => 'open',
        ]);

        // Item 1: 0.5 unidades de medicamento a $20,000 c/u => $10,000
        $res1 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => 0.5,
            'unit_price' => 20000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);
        $res1->assertStatus(201);

        // Item 2: 1.5 unidades de medicamento a $20,000 c/u => $30,000
        $res2 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => 1.5,
            'unit_price' => 20000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);
        $res2->assertStatus(201);

        // Item 3: 2.75 unidades de insumo a $0.00 (inventoriable)
        $res3 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'supply',
            'product_id' => $this->supply->id,
            'quantity' => 2.75,
            'unit_price' => 0.00,
            'is_billable' => false,
            'is_inventoriable' => true,
        ]);
        $res3->assertStatus(201);

        // Finalizar consulta
        $finalizeRes = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $finalizeRes->assertStatus(200);

        // Stock inicial medication = 100. Descontado 0.5 + 1.5 = 2.0 => Restante 98.0
        $this->assertEquals(98.0, $this->medication->stockOnHand($this->warehouse->id));

        // Stock inicial supply = 100. Descontado 2.75 => Restante 97.25
        $this->assertEquals(97.25, $this->supply->stockOnHand($this->warehouse->id));

        // Factura total: Consulta ($50,000) + Item1 ($10,000) + Item2 ($30,000) = $90,000
        $invoiceData = $finalizeRes->json('data.invoice');
        $this->assertEquals(90000.00, (float) $invoiceData['total']);
    }

    /**
     * C-03: Warehouse de otra company
     * Comportamiento seguro esperado: Intentar finalizar una consulta especificando una bodega (warehouse_id)
     * que pertenece a OTRA empresa debe ser RECHAZADO (422, 403 o 404), y NO debe descontar stock de la otra empresa.
     */
    public function test_c03_warehouse_de_otra_company_rejected(): void
    {
        // Crear Empresa B con su propia bodega
        $companyB = Company::create([
            'name' => 'Veterinaria B',
            'nit' => '900.999.888-2',
            'email' => 'vetb@test.com',
        ]);

        $warehouseB = Warehouse::create([
            'company_id' => $companyB->id,
            'name' => 'Bodega Empresa B',
            'status' => 'active',
        ]);

        // Stock en bodega B
        StockMovement::create([
            'company_id' => $companyB->id,
            'product_id' => $this->medication->id,
            'warehouse_id' => $warehouseB->id,
            'type' => 'COMPRA',
            'quantity' => 100,
            'reason' => 'Stock inicial Empresa B',
        ]);

        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'date' => now()->toDateString(),
            'reason' => 'Consulta en Empresa A',
            'status' => 'open',
        ]);

        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 1,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        // Intentar finalizar enviando la bodega de Empresa B
        $response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $warehouseB->id,
        ]);

        // Comportamiento seguro esperado: Rechazado (422 / 404 / 403)
        $response->assertStatus(422);

        // Verificar que el estado siga siendo 'open' y no se haya asignado warehouse de otra empresa
        $this->assertEquals('open', $consultation->refresh()->status);
        $this->assertNotEquals($warehouseB->id, $consultation->warehouse_id);
    }

    /**
     * C-04: Idempotencia
     * Comportamiento seguro esperado: Llamar reiteradamente a finalizar con la misma idempotency_key
     * devuelve la misma consulta finalizada (200) sin duplicar la factura ni los movimientos de inventario.
     */
    public function test_c04_idempotencia_previene_duplicados(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'price' => 40000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta idempotente',
            'status' => 'open',
        ]);

        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 2,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        $key = 'idempotent-key-test-c04';

        // Primer intento
        $res1 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'idempotency_key' => $key,
        ]);
        $res1->assertStatus(200);
        $invoiceId1 = $res1->json('data.invoice_id');

        // Segundo intento con la misma llave
        $res2 = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'idempotency_key' => $key,
        ]);
        $res2->assertStatus(200);
        $invoiceId2 = $res2->json('data.invoice_id');

        $this->assertEquals($invoiceId1, $invoiceId2);

        // Verificar que solo haya 1 movimiento de stock registrado para esta consulta
        $movementsCount = StockMovement::where('company_id', $this->company->id)
            ->where('reference', 'like', "consultation:{$consultation->id}:%")
            ->count();
        $this->assertEquals(1, $movementsCount);
    }

    /**
     * C-05: Doble consumo de stock
     * Comportamiento seguro esperado: La finalización descuenta el stock una única vez por item,
     * no duplicando los registros en stock_movements ni reduciendo el inventario dos veces.
     */
    public function test_c05_doble_consumo_de_stock(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'date' => now()->toDateString(),
            'reason' => 'Revisión de consumo',
            'status' => 'open',
        ]);

        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 5,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        $initialStock = $this->medication->stockOnHand($this->warehouse->id);

        $res = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $res->assertStatus(200);

        // Descuento exacto de 5 unidades
        $newStock = $this->medication->stockOnHand($this->warehouse->id);
        $this->assertEquals($initialStock - 5, $newStock);

        // Solo 1 StockMovement de tipo VENTA para esta consulta
        $movements = StockMovement::where('product_id', $this->medication->id)
            ->where('type', 'VENTA')
            ->get();
        $this->assertCount(1, $movements);
        $this->assertEquals(-5, $movements->first()->quantity);
    }

    /**
     * A-01: Cantidades/precios negativos
     * Comportamiento seguro esperado: El sistema RECHAZA (422 Unprocessable Entity) la adición de items
     * con cantidades negativas (p. ej. quantity = -5) o precios unitarios negativos (unit_price = -10000).
     */
    public function test_a01_cantidades_y_precios_negativos_rejected(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'date' => now()->toDateString(),
            'reason' => 'Prueba de valores negativos',
            'status' => 'open',
        ]);

        // 1. Intento de agregar item con cantidad negativa (-5) -> Debe ser 422
        $resNegQty = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => -5,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);
        $resNegQty->assertStatus(422);

        // 2. Intento de agregar item con precio negativo (-15000) -> Debe ser 422
        $resNegPrice = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/items", [
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'quantity' => 1,
            'unit_price' => -15000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);
        $resNegPrice->assertStatus(422);
    }

    /**
     * A-02: Modificación/eliminación de completed
     * Comportamiento seguro esperado: Una consulta en estado 'completed' NO se puede modificar vía PUT/PATCH
     * ni eliminar vía DELETE. Los endpoints deben retornar error 422 o 403.
     */
    public function test_a02_modificacion_y_eliminacion_de_completed_rejected(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'date' => now()->toDateString(),
            'reason' => 'Consulta completada pre-existente',
            'status' => 'completed',
            'finalized_at' => now(),
        ]);

        // 1. Intento de modificación vía PUT -> 422
        $putRes = $this->actingAs($this->vet)->putJson("/api/consultations/{$consultation->id}", [
            'reason' => 'Modificación maliciosa en consulta finalizada',
        ]);
        $putRes->assertStatus(422);

        // 2. Intento de eliminación vía DELETE -> 422 o 403
        $delRes = $this->actingAs($this->vet)->deleteJson("/api/consultations/{$consultation->id}");
        $this->assertTrue(in_array($delRes->getStatusCode(), [422, 403], true), "Expected status 422 or 403, got {$delRes->getStatusCode()}");
    }

    /**
     * A-03: Permisos para efectos ERP
     * Comportamiento seguro esperado: Un usuario que SOLO tiene el permiso 'medical_records.manage'
     * (sin 'stock.manage', 'invoices.manage', ni 'payments.manage') NO debe poder ejecutar
     * efectos ERP completos (descuento de inventario, generación de facturas de venta y pagos)
     * al finalizar una consulta, o bien el endpoint /finalize debe exigir los permisos ERP correspondientes.
     */
    public function test_a03_permisos_para_efectos_erp(): void
    {
        // Crear usuario con SOLO el permiso 'medical_records.manage'
        $clinicalOnlyRole = Role::firstOrCreate(['name' => 'SoloClinico', 'guard_name' => 'web']);
        $clinicalOnlyRole->syncPermissions(['medical_records.manage']);

        $clinicalVet = User::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Dr. Auxiliar Clínico',
            'email' => 'auxiliar@losandes.test',
        ]);
        $clinicalVet->assignRole($clinicalOnlyRole);

        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $clinicalVet->id,
            'price' => 50000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta de prueba de permisos',
            'status' => 'open',
        ]);

        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 1,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        // 1. Usuario con solo medical_records.manage PUEDE finalizar el acto clínico sin pago directo (200 OK)
        $responseClinical = $this->actingAs($clinicalVet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);
        $responseClinical->assertStatus(200);

        // 2. Consulta 2: Usuario con solo medical_records.manage INTENTA registrar pago directo -> 403 Forbidden
        $consultation2 = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $clinicalVet->id,
            'price' => 50000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta con cobro directo sin permiso',
            'status' => 'open',
        ]);

        $responsePayment = $this->actingAs($clinicalVet)->postJson("/api/consultations/{$consultation2->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'payment' => [
                'method' => 'cash',
                'amount' => 50000.00,
            ],
        ]);
        $responsePayment->assertStatus(403);
    }

    /**
     * A-04: Efectivo sin cash_session_id
     * Comportamiento seguro esperado: Finalizar una consulta especificando pago en efectivo ('method' => 'cash')
     * pero SIN proporcionar 'cash_session_id' (o siendo null) debe ser RECHAZADO (422 Unprocessable Entity),
     * ya que los pagos en efectivo requieren obligatoriamente una sesión de caja abierta.
     */
    public function test_a04_efectivo_sin_cash_session_id_rejected(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'price' => 50000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta pago efectivo sin sesion',
            'status' => 'open',
        ]);

        // Intentar finalizar enviando pago en efectivo pero SIN cash_session_id
        $response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
            'payment' => [
                'method' => 'cash',
                'amount' => 50000.00,
                // cash_session_id omitted or null
            ],
        ]);

        // Comportamiento seguro esperado: 422 Unprocessable Entity
        $response->assertStatus(422);
    }

    /**
     * A-05: Finalizar cancelled
     * Comportamiento seguro esperado: Intentar llamar a /finalize en una consulta con status = 'cancelled'
     * debe ser RECHAZADO con 422 Unprocessable Entity, y NO debe generar facturas ni descontar inventario.
     */
    public function test_a05_finalizar_cancelled_rejected(): void
    {
        $consultation = Consultation::create([
            'company_id' => $this->company->id,
            'patient_id' => $this->patient->id,
            'vet_id' => $this->vet->id,
            'price' => 50000.00,
            'date' => now()->toDateString(),
            'reason' => 'Consulta cancelada previamente',
            'status' => 'cancelled',
        ]);

        $consultation->items()->create([
            'company_id' => $this->company->id,
            'item_type' => 'medication',
            'product_id' => $this->medication->id,
            'name' => $this->medication->name,
            'quantity' => 1,
            'unit_price' => 35000.00,
            'is_billable' => true,
            'is_inventoriable' => true,
        ]);

        $initialStock = $this->medication->stockOnHand($this->warehouse->id);

        $response = $this->actingAs($this->vet)->postJson("/api/consultations/{$consultation->id}/finalize", [
            'warehouse_id' => $this->warehouse->id,
        ]);

        // Comportamiento seguro esperado: 422 Unprocessable Entity
        $response->assertStatus(422);

        // Estado sigue siendo 'cancelled'
        $this->assertEquals('cancelled', $consultation->refresh()->status);

        // El stock NO debe cambiar
        $this->assertEquals($initialStock, $this->medication->stockOnHand($this->warehouse->id));

        // NO debe haber factura creada
        $this->assertNull($consultation->invoice_id);
    }
}
