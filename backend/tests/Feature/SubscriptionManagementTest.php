<?php

namespace Tests\Feature;

use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SubscriptionManagementTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Suscripciones Test SA']);
        Permission::firstOrCreate(['name' => 'invoices.manage', 'guard_name' => 'web']);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->user->givePermissionTo('invoices.manage');
        Sanctum::actingAs($this->user, ['*']);

        $this->client = Client::create([
            'company_id' => $this->company->id,
            'name' => 'Cliente Suscriptor SA',
            'email' => 'suscriptor@test.com',
            'document_number' => '900123456',
        ]);
    }

    public function test_can_create_subscription_plan(): void
    {
        $response = $this->postJson('/api/subscription-plans', [
            'name' => 'Plan Mensual Pro',
            'code' => 'PLN-PRO',
            'price' => 150000,
            'billing_frequency' => 'monthly',
            'grace_days' => 5,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('subscription_plans', [
            'company_id' => $this->company->id,
            'name' => 'Plan Mensual Pro',
            'price' => 150000.00,
            'billing_frequency' => 'monthly',
        ]);
    }

    public function test_can_create_and_manage_subscription_lifecycle(): void
    {
        $plan = SubscriptionPlan::create([
            'company_id' => $this->company->id,
            'name' => 'Plan Anual VIP',
            'price' => 1200000,
            'billing_frequency' => 'annual',
        ]);

        $sub = $this->postJson('/api/subscriptions', [
            'client_id' => $this->client->id,
            'subscription_plan_id' => $plan->id,
            'start_date' => now()->toDateString(),
            'amount' => 1200000,
        ])->assertCreated()->json('data');

        $subId = $sub['id'];
        $this->assertSame('active', $sub['status']);

        // Pause
        $this->postJson("/api/subscriptions/{$subId}/pause")
            ->assertOk()
            ->assertJsonPath('data.status', 'paused');

        // Resume
        $this->postJson("/api/subscriptions/{$subId}/resume")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        // Cancel
        $this->postJson("/api/subscriptions/{$subId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_recurring_billing_process_generates_invoice_and_cxc(): void
    {
        $plan = SubscriptionPlan::create([
            'company_id' => $this->company->id,
            'name' => 'Plan Mensual Estándar',
            'price' => 50000,
            'billing_frequency' => 'monthly',
            'grace_days' => 7,
        ]);

        $startDate = Carbon::today()->subMonth();
        $subscription = Subscription::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'subscription_plan_id' => $plan->id,
            'subscription_number' => 'SUB-TEST-001',
            'status' => 'active',
            'start_date' => $startDate->toDateString(),
            'next_billing_date' => Carbon::today()->toDateString(),
            'amount' => 50000,
        ]);

        $response = $this->postJson('/api/subscriptions/process-billing', [
            'as_of_date' => Carbon::today()->toDateString(),
        ]);

        $response->assertOk()
            ->assertJsonPath('count', 1);

        // Check generated invoice
        $this->assertDatabaseHas('invoices', [
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'subscription_id' => $subscription->id,
            'total' => 50000.00,
        ]);

        // Check generated CxC
        $this->assertDatabaseHas('accounts_receivable', [
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'original_amount' => 50000.00,
            'balance' => 50000.00,
        ]);

        // Check subscription updated next_billing_date (should be +1 month from today)
        $subscription->refresh();
        $this->assertNotNull($subscription->last_billed_at);
        $this->assertSame(Carbon::today()->addMonth()->toDateString(), $subscription->next_billing_date->toDateString());
    }

    public function test_artisan_command_process_subscriptions(): void
    {
        $plan = SubscriptionPlan::create([
            'company_id' => $this->company->id,
            'name' => 'Plan Trimestral',
            'price' => 150000,
            'billing_frequency' => 'quarterly',
        ]);

        Subscription::create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'subscription_plan_id' => $plan->id,
            'subscription_number' => 'SUB-CMD-001',
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'next_billing_date' => now()->toDateString(),
            'amount' => 150000,
        ]);

        $this->artisan('subscriptions:process', ['--company' => $this->company->id])
            ->assertSuccessful();

        $this->assertDatabaseHas('invoices', [
            'company_id' => $this->company->id,
            'total' => 150000.00,
        ]);
    }
}
