<?php

namespace Tests\Feature;

use App\Models\AccountChart;
use App\Models\Company;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\AccountingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountingTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa Contabilidad SA']);
        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_can_get_default_chart_of_accounts(): void
    {
        $response = $this->getJson('/api/accounting/chart');

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => [['id', 'code', 'name', 'type']]]);

        // Check essential PUC accounts are created
        $this->assertDatabaseHas('account_charts', ['code' => '1105', 'name' => 'Caja General']);
        $this->assertDatabaseHas('account_charts', ['code' => '1305', 'name' => 'Clientes / Clientes Nacionales']);
        $this->assertDatabaseHas('account_charts', ['code' => '4135']);
    }

    public function test_can_create_custom_account(): void
    {
        $payload = [
            'code' => '5199',
            'name' => 'Gastos no Deducibles',
            'type' => 'expense',
        ];

        $response = $this->postJson('/api/accounting/chart', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('account_charts', [
            'company_id' => $this->company->id,
            'code' => '5199',
            'name' => 'Gastos no Deducibles',
        ]);
    }

    public function test_can_create_balanced_journal_entry(): void
    {
        $service = app(AccountingService::class);
        $service->seedDefaultChartOfAccounts($this->company->id);

        $caja = AccountChart::where('company_id', $this->company->id)->where('code', '1105')->first();
        $ventas = AccountChart::where('company_id', $this->company->id)->where('code', '4135')->first();

        $payload = [
            'date' => now()->toDateString(),
            'concept' => 'Venta en efectivo',
            'reference' => 'FAC-001',
            'items' => [
                [
                    'account_chart_id' => $caja->id,
                    'debit' => 150000,
                    'credit' => 0,
                    'description' => 'Ingreso a caja',
                ],
                [
                    'account_chart_id' => $ventas->id,
                    'debit' => 0,
                    'credit' => 150000,
                    'description' => 'Ingreso por ventas',
                ],
            ],
        ];

        $response = $this->postJson('/api/accounting/entries', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('journal_entries', [
            'company_id' => $this->company->id,
            'concept' => 'Venta en efectivo',
            'reference' => 'FAC-001',
        ]);
        $this->assertDatabaseHas('journal_entry_items', [
            'account_chart_id' => $caja->id,
            'debit' => 150000,
        ]);
    }

    public function test_cannot_create_unbalanced_journal_entry(): void
    {
        $service = app(AccountingService::class);
        $service->seedDefaultChartOfAccounts($this->company->id);

        $caja = AccountChart::where('company_id', $this->company->id)->where('code', '1105')->first();
        $ventas = AccountChart::where('company_id', $this->company->id)->where('code', '4135')->first();

        $payload = [
            'date' => now()->toDateString(),
            'concept' => 'Asiento desbalanceado',
            'items' => [
                [
                    'account_chart_id' => $caja->id,
                    'debit' => 150000,
                    'credit' => 0,
                ],
                [
                    'account_chart_id' => $ventas->id,
                    'debit' => 0,
                    'credit' => 100000, // Unequal credit!
                ],
            ],
        ];

        $response = $this->postJson('/api/accounting/entries', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'El asiento contable no está balanceado. Total Débito: 150000.00, Total Crédito: 100000.00']);
    }

    public function test_can_get_trial_balance_report(): void
    {
        $service = app(AccountingService::class);
        $service->seedDefaultChartOfAccounts($this->company->id);

        $caja = AccountChart::where('company_id', $this->company->id)->where('code', '1105')->first();
        $ventas = AccountChart::where('company_id', $this->company->id)->where('code', '4135')->first();

        $service->createEntry([
            'company_id' => $this->company->id,
            'date' => now()->toDateString(),
            'concept' => 'Venta contado',
            'items' => [
                ['account_chart_id' => $caja->id, 'debit' => 200000, 'credit' => 0],
                ['account_chart_id' => $ventas->id, 'debit' => 0, 'credit' => 200000],
            ],
        ]);

        $response = $this->getJson('/api/accounting/trial-balance');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'summary' => ['total_debit', 'total_credit', 'is_balanced'],
        ]);
        $this->assertEquals(200000, $response->json('summary.total_debit'));
        $this->assertEquals(200000, $response->json('summary.total_credit'));
        $this->assertTrue($response->json('summary.is_balanced'));
    }

    public function test_can_get_general_ledger_report(): void
    {
        $service = app(AccountingService::class);
        $service->seedDefaultChartOfAccounts($this->company->id);

        $caja = AccountChart::where('company_id', $this->company->id)->where('code', '1105')->first();
        $ventas = AccountChart::where('company_id', $this->company->id)->where('code', '4135')->first();

        $service->createEntry([
            'company_id' => $this->company->id,
            'date' => now()->toDateString(),
            'concept' => 'Cobro 1',
            'items' => [
                ['account_chart_id' => $caja->id, 'debit' => 50000, 'credit' => 0],
                ['account_chart_id' => $ventas->id, 'debit' => 0, 'credit' => 50000],
            ],
        ]);

        $response = $this->getJson('/api/accounting/general-ledger?account_id=' . $caja->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.account.code', '1105');
        $response->assertJsonPath('data.total_debit', 50000);
        $response->assertJsonPath('data.ending_balance', 50000);
    }
}
