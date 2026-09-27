<?php

namespace Tests\Feature;

use App\Models\BankStatement;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Company;
use App\Models\User;
use App\Services\BankReconciliationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BankReconciliationTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;
    private CashRegister $register;
    private CashSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa Conciliacion SA']);
        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        Sanctum::actingAs($this->user, ['*']);

        $this->register = CashRegister::create([
            'company_id' => $this->company->id,
            'name' => 'Caja Principal',
        ]);

        $this->session = CashSession::create([
            'company_id' => $this->company->id,
            'cash_register_id' => $this->register->id,
            'user_id' => $this->user->id,
            'opening_balance' => 500000,
            'opened_at' => now(),
            'status' => 'open',
        ]);
    }

    public function test_can_import_bank_statement(): void
    {
        $payload = [
            'bank_name' => 'Bancolombia',
            'account_number' => '123-456789-0',
            'file_name' => 'extracto_septiembre.csv',
            'items' => [
                [
                    'date' => now()->toDateString(),
                    'concept' => 'Consignación cliente',
                    'reference' => 'REF-001',
                    'amount' => 250000,
                ],
                [
                    'date' => now()->toDateString(),
                    'concept' => 'Pago proveedor insumos',
                    'reference' => 'REF-002',
                    'amount' => -100000,
                ],
            ],
        ];

        $response = $this->postJson('/api/finance/bank-statements/import', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('bank_statements', [
            'company_id' => $this->company->id,
            'bank_name' => 'Bancolombia',
            'total_items' => 2,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bank_statement_items', [
            'concept' => 'Consignación cliente',
            'amount' => 250000,
            'type' => 'credit',
        ]);
    }

    public function test_can_run_auto_matching(): void
    {
        $movement = CashMovement::create([
            'company_id' => $this->company->id,
            'cash_session_id' => $this->session->id,
            'user_id' => $this->user->id,
            'type' => 'in',
            'amount' => 300000,
            'source_type' => User::class,
            'source_id' => $this->user->id,
            'created_at' => now(),
        ]);

        $service = app(BankReconciliationService::class);
        $statement = $service->importStatement(
            $this->company->id,
            ['bank_name' => 'Banco de Bogotá'],
            [
                ['date' => now()->toDateString(), 'concept' => 'Depósito #101', 'amount' => 300000],
            ]
        );

        $response = $this->postJson("/api/finance/bank-statements/{$statement->id}/auto-match");

        $response->assertStatus(200);
        $response->assertJsonPath('data.matched', 1);

        $this->assertDatabaseHas('bank_reconciliations', [
            'company_id' => $this->company->id,
            'reconcilable_type' => CashMovement::class,
            'reconcilable_id' => $movement->id,
            'match_type' => 'exact',
        ]);

        $this->assertDatabaseHas('bank_statements', [
            'id' => $statement->id,
            'status' => 'reconciled',
        ]);
    }

    public function test_can_perform_manual_reconciliation(): void
    {
        $movement = CashMovement::create([
            'company_id' => $this->company->id,
            'cash_session_id' => $this->session->id,
            'user_id' => $this->user->id,
            'type' => 'out',
            'amount' => 85000,
            'source_type' => User::class,
            'source_id' => $this->user->id,
        ]);

        $service = app(BankReconciliationService::class);
        $statement = $service->importStatement(
            $this->company->id,
            ['bank_name' => 'BBVA'],
            [
                ['date' => now()->toDateString(), 'concept' => 'Débito automático internet', 'amount' => -85000],
            ]
        );

        $statementItem = $statement->items->first();

        $payload = [
            'bank_statement_item_id' => $statementItem->id,
            'reconcilable_type' => CashMovement::class,
            'reconcilable_id' => $movement->id,
            'notes' => 'Conciliación manual verificada',
        ];

        $response = $this->postJson('/api/finance/bank-reconciliations/manual', $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('bank_reconciliations', [
            'bank_statement_item_id' => $statementItem->id,
            'reconcilable_id' => $movement->id,
            'notes' => 'Conciliación manual verificada',
        ]);
    }

    public function test_can_get_summary_reconciliation_report(): void
    {
        $movement = CashMovement::create([
            'company_id' => $this->company->id,
            'cash_session_id' => $this->session->id,
            'user_id' => $this->user->id,
            'type' => 'in',
            'amount' => 450000,
            'source_type' => User::class,
            'source_id' => $this->user->id,
        ]);

        $service = app(BankReconciliationService::class);
        $statement = $service->importStatement(
            $this->company->id,
            ['bank_name' => 'Bancolombia'],
            [
                ['date' => now()->toDateString(), 'concept' => 'Transferencia recibida', 'amount' => 450000],
                ['date' => now()->toDateString(), 'concept' => 'Comisión bancaria', 'amount' => -5000],
            ]
        );

        $service->autoMatch($statement->id);

        $response = $this->getJson("/api/finance/bank-statements/{$statement->id}/report");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'statement' => ['id', 'bank_name', 'status'],
                'metrics' => [
                    'total_extract_items',
                    'reconciled_items_count',
                    'unreconciled_items_count',
                    'total_extract_amount',
                ],
                'pending_erp_movements',
                'items',
            ],
        ]);
        $this->assertEquals(2, $response->json('data.metrics.total_extract_items'));
        $this->assertEquals(1, $response->json('data.metrics.reconciled_items_count'));
    }
}
