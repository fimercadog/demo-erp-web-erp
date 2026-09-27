<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->boolean('is_domiciliary')->default(false)->after('status');
            $table->string('address')->nullable()->after('is_domiciliary');
            $table->string('city')->nullable()->after('address');
            $table->string('neighborhood')->nullable()->after('city');
            $table->text('address_reference')->nullable()->after('neighborhood');
            $table->string('dispatch_status')->default('pending')->after('address_reference'); // pending, assigned, en_route, arrived, completed
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'is_domiciliary',
                'address',
                'city',
                'neighborhood',
                'address_reference',
                'dispatch_status',
            ]);
        });
    }
};
