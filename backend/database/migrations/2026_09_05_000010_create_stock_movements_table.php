<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // in | out | adjustment
            // Firmado: "in"/adjustment positivo suma, "out" resta. El stock
            // disponible es SUM(quantity) por producto+bodega, sin tabla aparte.
            $table->decimal('quantity', 12, 4);
            $table->string('reason')->nullable();
            // Origen simple del movimiento (p.ej. "purchase_order:12", "order:7").
            // No es una relacion polimorfica real: es solo texto de referencia
            // para trazabilidad, no se usa para joins ni integridad referencial.
            $table->string('reference')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'product_id', 'warehouse_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
