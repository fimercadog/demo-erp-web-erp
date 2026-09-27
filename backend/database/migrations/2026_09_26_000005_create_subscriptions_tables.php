<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->enum('billing_frequency', ['monthly', 'bimonthly', 'quarterly', 'semi_annual', 'annual'])->default('monthly');
            $table->unsignedInteger('grace_days')->default(0);
            $table->boolean('auto_renew')->default(true);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->string('subscription_number')->unique();
            $table->enum('status', ['active', 'paused', 'cancelled', 'expired'])->default('active');
            $table->date('start_date');
            $table->date('next_billing_date');
            $table->date('end_date')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamp('last_billed_at')->nullable();
            $table->decimal('amount', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->after('warehouse_id')->constrained('subscriptions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
        });

        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};
