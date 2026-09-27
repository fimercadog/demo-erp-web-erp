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
        Schema::create('bank_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('bank_name');
            $table->string('account_number')->nullable();
            $table->string('file_name');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('total_items')->default(0);
            $table->decimal('total_debits', 15, 2)->default(0);
            $table->decimal('total_credits', 15, 2)->default(0);
            $table->string('status')->default('pending'); // pending, partially_reconciled, reconciled
            $table->foreignId('imported_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('bank_statement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_statement_id')->constrained('bank_statements')->onDelete('cascade');
            $table->date('date');
            $table->string('concept');
            $table->string('reference')->nullable();
            $table->decimal('amount', 15, 2);
            $table->enum('type', ['credit', 'debit']);
            $table->string('status')->default('unreconciled'); // unreconciled, reconciled, discrepancy
            $table->timestamps();
        });

        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('bank_statement_item_id')->constrained('bank_statement_items')->onDelete('cascade');
            $table->string('reconcilable_type');
            $table->unsignedBigInteger('reconcilable_id');
            $table->string('match_type')->default('exact'); // exact, manual, discrepancy
            $table->decimal('amount_difference', 15, 2)->default(0);
            $table->string('notes')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reconciled_at')->nullable();
            $table->timestamps();

            $table->index(['reconcilable_type', 'reconcilable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliations');
        Schema::dropIfExists('bank_statement_items');
        Schema::dropIfExists('bank_statements');
    }
};
