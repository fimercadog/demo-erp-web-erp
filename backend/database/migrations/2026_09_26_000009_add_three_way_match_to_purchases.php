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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('three_way_match_status')->default('pending')->after('status');
            $table->text('three_way_match_notes')->nullable()->after('three_way_match_status');
            $table->timestamp('matched_at')->nullable()->after('three_way_match_notes');
        });

        Schema::table('accounts_payable', function (Blueprint $table) {
            $table->string('three_way_match_status')->default('pending')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['three_way_match_status', 'three_way_match_notes', 'matched_at']);
        });

        Schema::table('accounts_payable', function (Blueprint $table) {
            $table->dropColumn(['three_way_match_status']);
        });
    }
};
