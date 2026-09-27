<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Company;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\BranchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class BranchManagementTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Multisede Test SA']);
        Permission::firstOrCreate(['name' => 'settings.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('settings.manage');
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_branch_creation_and_main_branch_logic(): void
    {
        // First branch automatically becomes main
        $b1 = $this->postJson('/api/branches', [
            'name' => 'Sede Norte',
            'address' => 'Calle 100 # 15-20',
        ])->assertCreated()->json('data');

        $this->assertTrue($b1['is_main']);
        $this->assertSame('SED-01', $b1['code']);

        // Second branch with is_main=true changes main flag
        $b2 = $this->postJson('/api/branches', [
            'name' => 'Sede Sur Principal',
            'is_main' => true,
        ])->assertCreated()->json('data');

        $this->assertTrue($b2['is_main']);
        $this->assertDatabaseHas('branches', ['id' => $b1['id'], 'is_main' => false]);
    }

    public function test_assign_user_to_branch_and_resolution(): void
    {
        $service = app(BranchService::class);

        $branch = Branch::create([
            'company_id' => $this->company->id,
            'code' => 'SED-02',
            'name' => 'Sede Poblado',
            'is_main' => true,
        ]);

        $this->postJson('/api/branches/'.$branch->id.'/assign-user', [
            'user_id' => $this->user->id,
            'set_primary' => true,
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'branch_id' => $branch->id,
        ]);

        $resolved = $service->resolveActiveBranch(request(), $this->company->id);
        $this->assertNotNull($resolved);
        $this->assertSame($branch->id, $resolved->id);
    }

    public function test_warehouse_and_cash_register_isolation_by_branch(): void
    {
        $branch1 = Branch::create(['company_id' => $this->company->id, 'code' => 'SED-01', 'name' => 'Sede 1']);
        $branch2 = Branch::create(['company_id' => $this->company->id, 'code' => 'SED-02', 'name' => 'Sede 2']);

        $w1 = Warehouse::factory()->create(['company_id' => $this->company->id, 'branch_id' => $branch1->id]);
        $w2 = Warehouse::factory()->create(['company_id' => $this->company->id, 'branch_id' => $branch2->id]);

        $cr1 = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $branch1->id, 'name' => 'Caja 1']);
        $cr2 = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $branch2->id, 'name' => 'Caja 2']);

        $this->assertDatabaseHas('warehouses', ['id' => $w1->id, 'branch_id' => $branch1->id]);
        $this->assertDatabaseHas('warehouses', ['id' => $w2->id, 'branch_id' => $branch2->id]);

        $this->assertDatabaseHas('cash_registers', ['id' => $cr1->id, 'branch_id' => $branch1->id]);
        $this->assertDatabaseHas('cash_registers', ['id' => $cr2->id, 'branch_id' => $branch2->id]);
    }

    public function test_single_branch_company_backward_compatibility(): void
    {
        // Empresa sin sedes registradas sigue funcionando con branch_id = null
        $this->assertDatabaseMissing('branches', ['company_id' => $this->company->id]);
        $w = Warehouse::factory()->create(['company_id' => $this->company->id, 'branch_id' => null]);

        $this->assertNull($w->branch_id);
    }
}
