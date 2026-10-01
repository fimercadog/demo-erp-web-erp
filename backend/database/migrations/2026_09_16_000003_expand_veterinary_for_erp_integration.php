<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->string('status', 30)->default('open')->after('plan');
            $table->foreignId('service_id')->nullable()->after('status')->constrained('services')->nullOnDelete();
            $table->decimal('price', 12, 2)->default(0)->after('service_id');
            $table->foreignId('invoice_id')->nullable()->after('price')->constrained('invoices')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->after('invoice_id')->constrained('warehouses')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable()->after('warehouse_id');
            $table->foreignId('finalized_by')->nullable()->after('finalized_at')->constrained('users')->nullOnDelete();
            $table->string('idempotency_key', 100)->nullable()->after('finalized_by');

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'idempotency_key']);
        });

        Schema::create('consultation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->string('item_type', 30); // service, procedure, medication, supply, product
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('procedure_id')->nullable()->constrained('procedures')->nullOnDelete();
            $table->string('name');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->boolean('is_billable')->default(true);
            $table->boolean('is_inventoriable')->default(false);
            $table->foreignId('stock_movement_id')->nullable()->constrained('stock_movements')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'consultation_id']);
        });

        Schema::table('procedures', function (Blueprint $table) {
            $table->foreignId('consultation_id')->nullable()->after('service_id')->constrained('consultations')->nullOnDelete();
            $table->decimal('price', 12, 2)->default(0)->after('type');
            $table->string('status', 30)->default('completed')->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('procedures', function (Blueprint $table) {
            $table->dropForeign(['consultation_id']);
            $table->dropColumn(['consultation_id', 'price', 'status']);
        });

        Schema::dropIfExists('consultation_items');

        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['invoice_id']);
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['finalized_by']);
            $table->dropColumn([
                'status', 'service_id', 'price', 'invoice_id', 'warehouse_id',
                'finalized_at', 'finalized_by', 'idempotency_key',
            ]);
        });
    }
};
