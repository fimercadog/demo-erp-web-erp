<?php

namespace Tests\Feature;

use App\Models\AccountPayable;
use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AccountsReceivablePayableTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Client $client;

    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Finanzas Test SA']);
        $this->client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Alfa',
            'email' => 'alfa@test.com',
        ]);
        $this->supplier = Supplier::create([
            'company_id' => $this->company->id,
            'name' => 'Proveedor Beta',
            'email' => 'beta@test.com',
        ]);

        $permissions = [
            'accounts_receivable.view',
            'accounts_payable.view',
            'invoices.manage',
            'purchase_orders.manage',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo($permissions);
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_account_receivable_overdue_attributes_and_filtering(): void
    {
        $invoice1 = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'number' => 'FI-000001',
            'total' => 1000,
            'subtotal' => 1000,
        ]);

        $invoice2 = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'number' => 'FI-000002',
            'total' => 2000,
            'subtotal' => 2000,
        ]);

        // Current receivable (not overdue)
        $ar1 = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice1->id,
            'original_amount' => 1000,
            'paid_amount' => 0,
            'balance' => 1000,
            'due_date' => now()->addDays(10)->toDateString(),
            'status' => 'pending',
        ]);

        // Overdue receivable (15 days overdue)
        $ar2 = AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice2->id,
            'original_amount' => 2000,
            'paid_amount' => 500,
            'balance' => 1500,
            'due_date' => now()->subDays(15)->toDateString(),
            'status' => 'partial',
        ]);

        $this->assertFalse($ar1->is_overdue);
        $this->assertSame(0, $ar1->days_overdue);

        $this->assertTrue($ar2->is_overdue);
        $this->assertSame(15, $ar2->days_overdue);

        // Test filtering by status=overdue via API
        $response = $this->getJson('/api/accounts-receivable?status=overdue')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $response);
        $this->assertSame($ar2->id, $response[0]['id']);
        $this->assertTrue($response[0]['is_overdue']);
        $this->assertSame(15, $response[0]['days_overdue']);
    }

    public function test_receivables_aging_report_and_summary_api(): void
    {
        $invoice1 = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'number' => 'FI-000003',
            'total' => 1000,
            'subtotal' => 1000,
        ]);

        // 10 days overdue (1-30 days bucket)
        AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice1->id,
            'original_amount' => 1000,
            'paid_amount' => 0,
            'balance' => 1000,
            'due_date' => now()->subDays(10)->toDateString(),
            'status' => 'pending',
        ]);

        // 45 days overdue (31-60 days bucket)
        $invoice2 = Invoice::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'number' => 'FI-000004',
            'total' => 2000,
            'subtotal' => 2000,
        ]);
        AccountReceivable::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'invoice_id' => $invoice2->id,
            'original_amount' => 2000,
            'paid_amount' => 0,
            'balance' => 2000,
            'due_date' => now()->subDays(45)->toDateString(),
            'status' => 'pending',
        ]);

        // Aging report endpoint
        $this->getJson('/api/accounts-receivable/aging')
            ->assertOk()
            ->assertJsonPath('data.totals.days_1_30', 1000)
            ->assertJsonPath('data.totals.days_31_60', 2000)
            ->assertJsonPath('data.totals.total_balance', 3000)
            ->assertJsonPath('data.totals.count', 2);

        // Summary KPI endpoint
        $this->getJson('/api/accounts-receivable/summary')
            ->assertOk()
            ->assertJsonPath('data.total_original', 3000)
            ->assertJsonPath('data.total_balance', 3000)
            ->assertJsonPath('data.overdue_balance', 3000)
            ->assertJsonPath('data.overdue_count', 2)
            ->assertJsonPath('data.pending_count', 2);
    }

    public function test_payables_aging_report_and_summary_api(): void
    {
        $warehouse = \App\Models\Warehouse::factory()->create(['company_id' => $this->company->id]);
        $po = PurchaseOrder::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'warehouse_id' => $warehouse->id,
            'order_number' => 'PO-000001',
            'total' => 3500,
            'subtotal' => 3500,
        ]);

        // 75 days overdue (61-90 days bucket)
        AccountPayable::create([
            'company_id' => $this->company->id,
            'supplier_id' => $this->supplier->id,
            'purchase_order_id' => $po->id,
            'original_amount' => 3500,
            'paid_amount' => 500,
            'balance' => 3000,
            'due_date' => now()->subDays(75)->toDateString(),
            'status' => 'partial',
        ]);

        // Aging report endpoint
        $this->getJson('/api/accounts-payable/aging')
            ->assertOk()
            ->assertJsonPath('data.totals.days_61_90', 3000)
            ->assertJsonPath('data.totals.total_balance', 3000)
            ->assertJsonPath('data.totals.count', 1);

        // Summary KPI endpoint
        $this->getJson('/api/accounts-payable/summary')
            ->assertOk()
            ->assertJsonPath('data.total_original', 3500)
            ->assertJsonPath('data.total_paid', 500)
            ->assertJsonPath('data.total_balance', 3000)
            ->assertJsonPath('data.overdue_balance', 3000)
            ->assertJsonPath('data.overdue_count', 1);
    }
}
