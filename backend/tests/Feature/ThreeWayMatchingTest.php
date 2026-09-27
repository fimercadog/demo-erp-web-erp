<?php

namespace Tests\Feature;

use App\Models\AccountPayable;
use App\Models\Company;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ThreeWayMatchingTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private Supplier $supplier;
    private Warehouse $warehouse;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa Compras SA']);
        $this->supplier = Supplier::create([
            'company_id' => $this->company->id,
            'name' => 'Proveedor Principal',
        ]);
        $this->warehouse = Warehouse::factory()->create(['company_id' => $this->company->id]);
        $this->product = Product::factory()->create([
            'company_id' => $this->company->id,
            'unit_price' => 10000,
        ]);

        Permission::firstOrCreate(['name' => 'purchase_orders.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('purchase_orders.manage');
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_evaluates_pending_when_documents_missing(): void
    {
        $po = PurchaseOrder::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'order_date' => now(),
            'total' => 100000,
        ]);

        $response = $this->getJson("/api/purchases/{$po->id}/three-way-match");

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.summary.has_receipts', false);
        $response->assertJsonPath('data.summary.has_invoices', false);
    }

    public function test_evaluates_exact_3_way_match(): void
    {
        $po = PurchaseOrder::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'confirmed',
            'order_date' => now(),
            'total' => 100000,
        ]);

        $poItem = PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'quantity' => 10,
            'unit_cost' => 10000,
            'line_total' => 100000,
        ]);

        $receipt = PurchaseReceipt::create([
            'company_id' => $this->company->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $this->warehouse->id,
            'received_at' => now(),
        ]);

        PurchaseReceiptItem::create([
            'purchase_receipt_id' => $receipt->id,
            'purchase_order_item_id' => $poItem->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'unit_cost' => 10000,
            'quantity' => 10,
            'line_total' => 100000,
        ]);

        AccountPayable::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'purchase_order_id' => $po->id,
            'original_amount' => 100000,
            'paid_amount' => 0,
            'balance' => 100000,
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/purchases/{$po->id}/three-way-match");

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'matched');
        $response->assertJsonPath('data.summary.has_receipts', true);
        $response->assertJsonPath('data.summary.has_invoices', true);
        $response->assertJsonPath('data.summary.amount_difference', 0);

        $this->assertDatabaseHas('purchase_orders', [
            'id' => $po->id,
            'three_way_match_status' => 'matched',
        ]);
    }

    public function test_detects_quantity_discrepancy(): void
    {
        $po = PurchaseOrder::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'confirmed',
            'order_date' => now(),
            'total' => 100000,
        ]);

        $poItem = PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'quantity' => 10,
            'unit_cost' => 10000,
            'line_total' => 100000,
        ]);

        $receipt = PurchaseReceipt::create([
            'company_id' => $this->company->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $this->warehouse->id,
            'received_at' => now(),
        ]);

        // Received only 6 units instead of 10!
        PurchaseReceiptItem::create([
            'purchase_receipt_id' => $receipt->id,
            'purchase_order_item_id' => $poItem->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'unit_cost' => 10000,
            'quantity' => 6,
            'line_total' => 60000,
        ]);

        AccountPayable::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'purchase_order_id' => $po->id,
            'original_amount' => 100000,
            'paid_amount' => 0,
            'balance' => 100000,
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/purchases/{$po->id}/three-way-match");

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'discrepancy');
        $this->assertDatabaseHas('purchase_orders', [
            'id' => $po->id,
            'three_way_match_status' => 'discrepancy',
        ]);
    }
}
