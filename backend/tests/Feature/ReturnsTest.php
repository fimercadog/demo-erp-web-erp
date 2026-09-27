<?php

namespace Tests\Feature;

use App\Models\AccountPayable;
use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ReturnsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Client $client;

    private Supplier $supplier;

    private Warehouse $warehouse;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Devoluciones Test SA']);
        $this->client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Delta',
            'email' => 'delta@test.com',
        ]);
        $this->supplier = Supplier::create([
            'company_id' => $this->company->id,
            'name' => 'Proveedor Epsilon',
            'email' => 'epsilon@test.com',
        ]);
        $this->warehouse = Warehouse::factory()->create(['company_id' => $this->company->id]);
        $this->product = Product::factory()->create([
            'company_id' => $this->company->id,
            'unit_price' => 1500,
            'cost_price' => 900,
        ]);

        $permissions = [
            'invoices.manage',
            'purchase_orders.manage',
            'accounts_receivable.view',
            'accounts_payable.view',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo($permissions);
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_sales_return_restocks_inventory_and_generates_credit_note(): void
    {
        // Stock inicial de 10
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 10,
            'reason' => 'Stock inicial',
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'warehouse_id' => $this->warehouse->id,
            'number' => 'FI-000200',
            'status' => 'issued',
            'subtotal' => 4500,
            'total' => 4500,
        ]);

        $receivable = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice->id,
            'original_amount' => 4500,
            'paid_amount' => 0,
            'balance' => 4500,
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/sales-returns', [
            'invoice_id' => $invoice->id,
            'client_id' => $this->client->id,
            'warehouse_id' => $this->warehouse->id,
            'return_type' => 'credit_note',
            'condition' => 'good_condition',
            'reason' => 'Empaque defectuoso pero producto intacto',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 3,
                    'unit_price' => 1500,
                ],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('DV-000001', $response['number']);
        $this->assertNotNull($response['credit_note_id']);

        // Stock de inventario aumenta de 10 a 13
        $this->assertSame(13, $this->product->fresh()->stockOnHand($this->warehouse->id));

        // Saldo de CxC disminuye de 4500 a 0 (3 * 1500 = 4500)
        $this->assertDatabaseHas('accounts_receivable', [
            'id' => $receivable->id,
            'balance' => 0,
            'status' => 'paid',
        ]);
    }

    public function test_purchase_return_decreases_inventory_and_reduces_payable_balance(): void
    {
        // Stock inicial de 20
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 20,
            'reason' => 'Stock inicial',
        ]);

        $po = PurchaseOrder::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'order_number' => 'PO-000200',
            'total' => 4500,
            'subtotal' => 4500,
        ]);

        $payable = AccountPayable::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'purchase_order_id' => $po->id,
            'original_amount' => 4500,
            'paid_amount' => 0,
            'balance' => 4500,
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/purchase-returns', [
            'purchase_order_id' => $po->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'reason' => 'Falla de calidad detectada en lote de proveedor',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 5,
                    'unit_cost' => 900,
                ],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('DP-000001', $response['number']);

        // Stock de inventario disminuye de 20 a 15 (20 - 5 = 15)
        $this->assertSame(15, $this->product->fresh()->stockOnHand($this->warehouse->id));

        // Saldo de CxP disminuye de 4500 a 0 (5 * 900 = 4500)
        $this->assertDatabaseHas('accounts_payable', [
            'id' => $payable->id,
            'balance' => 0,
            'status' => 'paid',
        ]);
    }
}
