<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\Company;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
            $table->string('city')->default('Bogotá')->after('address');
            $table->string('currency')->default('COP')->after('locale');
            $table->time('work_start_time')->default('08:00:00')->after('date_format');
            $table->integer('late_grace_minutes')->default(15)->after('work_start_time');
            $table->string('vertical')->default('ips')->after('late_grace_minutes');
        });

        // Populate slug for existing companies
        foreach (Company::all() as $company) {
            if (empty($company->slug)) {
                $company->slug = Str::slug($company->name);
                $company->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['slug', 'city', 'currency', 'work_start_time', 'late_grace_minutes', 'vertical']);
        });
    }
};
