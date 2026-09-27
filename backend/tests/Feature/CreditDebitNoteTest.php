<?php

namespace Tests\Feature;

use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CreditDebitNoteTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Client $client;

    private Warehouse $warehouse;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Notas Test SA']);
        $this->client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Gamma',
            'email' => 'gamma@test.com',
        ]);
        $this->warehouse = Warehouse::factory()->create(['company_id' => $this->company->id]);
        $this->product = Product::factory()->create([
            'company_id' => $this->company->id,
            'unit_price' => 1000,
        ]);

        $permissions = [
            'invoices.manage',
            'accounts_receivable.view',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo($permissions);
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_total_credit_note_reduces_receivable_balance_and_credits_invoice(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'warehouse_id' => $this->warehouse->id,
            'number' => 'FI-000100',
            'status' => 'issued',
            'subtotal' => 1000,
            'total' => 1000,
        ]);

        $receivable = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice->id,
            'original_amount' => 1000,
            'paid_amount' => 0,
            'balance' => 1000,
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/credit-notes', [
            'invoice_id' => $invoice->id,
            'reason' => 'Anulación total por solicitud de cliente',
            'total' => 1000,
            'restock_inventory' => false,
        ])->assertCreated()->json('data');

        $this->assertSame('NC-000001', $response['number']);
        $this->assertSame('total', $response['type']);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'credited',
        ]);

        $this->assertDatabaseHas('accounts_receivable', [
            'id' => $receivable->id,
            'balance' => 0,
            'status' => 'paid',
        ]);
    }

    public function test_partial_credit_note_with_inventory_restock(): void
    {
        // Stock inicial de 5
        StockMovement::create([
            'company_id' => $this->company->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'COMPRA',
            'quantity' => 5,
            'reason' => 'Stock inicial',
        ]);

        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'warehouse_id' => $this->warehouse->id,
            'number' => 'FI-000101',
            'status' => 'issued',
            'subtotal' => 2000,
            'total' => 2000,
        ]);

        $receivable = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice->id,
            'original_amount' => 2000,
            'paid_amount' => 0,
            'balance' => 2000,
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $this->postJson('/api/credit-notes', [
            'invoice_id' => $invoice->id,
            'reason' => 'Devolución de 2 unidades',
            'type' => 'partial',
            'restock_inventory' => true,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 2,
                    'unit_price' => 1000,
                ],
            ],
        ])->assertCreated();

        // Saldo de CxC debe reducirse de 2000 a 0
        $this->assertDatabaseHas('accounts_receivable', [
            'id' => $receivable->id,
            'balance' => 0,
        ]);

        // Stock de inventario debe subir de 5 a 7 (5 inicial + 2 devueltos)
        $this->assertSame(7, $this->product->fresh()->stockOnHand($this->warehouse->id));

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'type' => 'DEVOLUCION_VENTA',
            'quantity' => 2,
        ]);
    }

    public function test_debit_note_increases_receivable_balance(): void
    {
        $invoice = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'number' => 'FI-000102',
            'status' => 'issued',
            'subtotal' => 1000,
            'total' => 1000,
        ]);

        $receivable = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice->id,
            'original_amount' => 1000,
            'paid_amount' => 0,
            'balance' => 1000,
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/debit-notes', [
            'invoice_id' => $invoice->id,
            'reason' => 'Recargo por flete o intereses de mora',
            'total' => 150,
        ])->assertCreated()->json('data');

        $this->assertSame('ND-000001', $response['number']);

        $this->assertDatabaseHas('accounts_receivable', [
            'id' => $receivable->id,
            'original_amount' => 1150,
            'balance' => 1150,
        ]);
    }
}
