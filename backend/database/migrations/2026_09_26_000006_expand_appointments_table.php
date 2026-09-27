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
        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('patient_id')->nullable()->change();
            $table->foreignId('client_id')->nullable()->after('patient_id')->constrained('clients')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('company_id')->constrained('branches')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('account_receivable_id')->nullable()->constrained('accounts_receivable')->nullOnDelete();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('payment_status')->default('unpaid');
            $table->boolean('reminder_sent')->default(false);
            $table->text('cancellation_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['account_receivable_id']);
            $table->dropForeign(['invoice_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['client_id']);

            $table->dropColumn([
                'client_id',
                'branch_id',
                'invoice_id',
                'account_receivable_id',
                'price',
                'payment_status',
                'reminder_sent',
                'cancellation_reason',
            ]);
        });
    }
};
