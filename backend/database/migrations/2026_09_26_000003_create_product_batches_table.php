<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('requires_batch')->default(false)->after('is_public');
            $table->boolean('requires_expiration')->default(false)->after('requires_batch');
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('purchase_receipt_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_number');
            $table->date('manufacturing_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->integer('initial_quantity')->default(0);
            $table->integer('current_quantity')->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->string('status')->default('active'); // active, near_expiration, expired, depleted
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'product_id', 'status']);
            $table->index(['company_id', 'expiration_date']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('product_batch_id')->nullable()->after('warehouse_id')->constrained('product_batches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['product_batch_id']);
            $table->dropColumn('product_batch_id');
        });

        Schema::dropIfExists('product_batches');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['requires_batch', 'requires_expiration']);
        });
    }
};
