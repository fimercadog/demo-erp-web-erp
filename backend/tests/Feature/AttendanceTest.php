<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Company;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa Test SA']);
        $this->user = User::factory()->create(['company_id' => $this->company->id]);

        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_user_can_check_in_and_check_out(): void
    {
        Carbon::setTestNow('2026-09-26 08:00:00');

        $response = $this->postJson('/api/attendance/check-in', [
            'notes' => 'Llegada a tiempo',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'present');

        $this->assertDatabaseHas('attendances', [
            'company_id' => $this->company->id,
            'user_id' => $this->user->id,
            'status' => 'present',
        ]);

        // Check-out 8 hours later
        Carbon::setTestNow('2026-09-26 16:00:00');

        $outResponse = $this->postJson('/api/attendance/check-out', [
            'notes' => 'Fin de turno',
        ]);

        $outResponse->assertStatus(200);
        $outResponse->assertJsonPath('data.work_duration_minutes', 480);

        Carbon::setTestNow();
    }

    public function test_marks_late_if_check_in_after_scheduled_time(): void
    {
        Carbon::setTestNow('2026-09-26 09:15:00');

        $response = $this->postJson('/api/attendance/check-in');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'late');

        Carbon::setTestNow();
    }

    public function test_prevents_duplicate_check_in_on_same_day(): void
    {
        Carbon::setTestNow('2026-09-26 08:00:00');

        $this->postJson('/api/attendance/check-in')->assertStatus(200);

        // Second check-in attempt on the same day
        $response = $this->postJson('/api/attendance/check-in');
        $response->assertStatus(422);

        Carbon::setTestNow();
    }

    public function test_can_register_novedad_and_query_summary(): void
    {
        $employee = User::factory()->create(['company_id' => $this->company->id]);

        $response = $this->postJson('/api/attendance/novedad', [
            'user_id' => $employee->id,
            'date' => '2026-09-25',
            'status' => 'justified_absence',
            'notes' => 'Cita médica justificada',
        ]);

        $response->assertStatus(200);

        $summaryResponse = $this->getJson('/api/attendance/summary?start_date=2026-09-01&end_date=2026-09-30');
        $summaryResponse->assertStatus(200);
        $summaryResponse->assertJsonPath('data.justified_absence_count', 1);

        $listResponse = $this->getJson('/api/attendance?user_id=' . $employee->id);
        $listResponse->assertStatus(200);
        $listResponse->assertJsonCount(1, 'data');
    }

    public function test_attendance_records_are_isolated_by_company(): void
    {
        $companyB = Company::create(['name' => 'Empresa B']);
        $userB = User::factory()->create(['company_id' => $companyB->id]);

        Attendance::create([
            'company_id' => $companyB->id,
            'user_id' => $userB->id,
            'date' => '2026-09-26',
            'status' => 'present',
        ]);

        $listResponse = $this->getJson('/api/attendance');
        $listResponse->assertStatus(200);
        $listResponse->assertJsonCount(0, 'data');
    }
}
