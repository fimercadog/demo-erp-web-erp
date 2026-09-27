<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\BatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class BatchManagementTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Warehouse $warehouse;

    private Product $product;

    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Lotes Test SA']);
        $this->warehouse = Warehouse::factory()->create(['company_id' => $this->company->id]);
        $this->supplier = Supplier::create([
            'company_id' => $this->company->id,
            'name' => 'Laboratorio Farmacéutico',
            'email' => 'lab@test.com',
        ]);

        $this->product = Product::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Amoxicilina 500mg',
            'unit_price' => 2000,
            'cost_price' => 1200,
            'requires_batch' => true,
            'requires_expiration' => true,
        ]);

        Permission::firstOrCreate(['name' => 'products.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('products.manage');
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_batch_creation_and_api_listing(): void
    {
        $response = $this->postJson('/api/product-batches', [
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'batch_number' => 'LOT-2026-001',
            'manufacturing_date' => now()->subMonths(2)->toDateString(),
            'expiration_date' => now()->addMonths(12)->toDateString(),
            'initial_quantity' => 100,
            'unit_cost' => 1200,
            'notes' => 'Lote de importación primaria',
        ])->assertCreated()->json('data');

        $this->assertSame('LOT-2026-001', $response['batch_number']);
        $this->assertSame(100, $response['current_quantity']);
        $this->assertSame('active', $response['status']);

        // Listing API
        $this->getJson('/api/product-batches?product_id='.$this->product->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.batch_number', 'LOT-2026-001');
    }

    public function test_fefo_strategy_returns_earliest_expiring_batch(): void
    {
        $service = app(BatchService::class);

        // Batch A: Expira en 60 días (50 unidades)
        $batchA = $service->createOrUpdateBatch([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'batch_number' => 'LOT-A-60DAYS',
            'expiration_date' => now()->addDays(60)->toDateString(),
            'initial_quantity' => 50,
        ], $this->company->id);

        // Batch B: Expira en 15 días (30 unidades)
        $batchB = $service->createOrUpdateBatch([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'batch_number' => 'LOT-B-15DAYS',
            'expiration_date' => now()->addDays(15)->toDateString(),
            'initial_quantity' => 30,
        ], $this->company->id);

        $fefoBatch = $service->getFefoBatch($this->company->id, $this->product->id, $this->warehouse->id, 10);

        $this->assertNotNull($fefoBatch);
        $this->assertSame('LOT-B-15DAYS', $fefoBatch->batch_number);
    }

    public function test_batch_movement_registration_and_traceability_api(): void
    {
        $service = app(BatchService::class);

        $batch = $service->createOrUpdateBatch([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'batch_number' => 'LOT-TRACE-01',
            'expiration_date' => now()->addDays(90)->toDateString(),
            'initial_quantity' => 50,
        ], $this->company->id);

        $movement = StockMovement::create([
            'company_id' => $this->company->id,
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'VENTA',
            'quantity' => -10,
            'reason' => 'Venta en mostrador',
        ]);

        $service->registerBatchMovement($movement, $batch->id);

        $this->assertSame(40, $batch->fresh()->current_quantity);

        // Traceability API
        $response = $this->getJson('/api/product-batches/'.$batch->id.'/traceability')
            ->assertOk()
            ->json('data');

        $this->assertSame(40, $response['current_balance']);
        $this->assertSame(10, $response['total_out']);
        $this->assertCount(1, $response['movements']);
    }

    public function test_expiration_report_api(): void
    {
        $service = app(BatchService::class);

        // Expired batch (-10 days)
        $service->createOrUpdateBatch([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'batch_number' => 'LOT-EXPIRED',
            'expiration_date' => now()->subDays(10)->toDateString(),
            'initial_quantity' => 20,
            'unit_cost' => 1000,
        ], $this->company->id);

        // Near expiration batch (10 days remaining)
        $service->createOrUpdateBatch([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'batch_number' => 'LOT-NEAR',
            'expiration_date' => now()->addDays(10)->toDateString(),
            'initial_quantity' => 15,
            'unit_cost' => 1000,
        ], $this->company->id);

        $this->getJson('/api/product-batches/expiring-report?days=30')
            ->assertOk()
            ->assertJsonPath('data.summary.expired_count', 1)
            ->assertJsonPath('data.summary.near_expiration_count', 1)
            ->assertJsonPath('data.summary.expired_economic_value', 20000)
            ->assertJsonPath('data.summary.near_expiration_economic_value', 15000);
    }
}
