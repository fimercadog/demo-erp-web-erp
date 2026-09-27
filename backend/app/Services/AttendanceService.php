<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    /**
     * Record Check-in for an employee.
     */
    public function checkIn(User $user, ?string $notes = null, ?Carbon $timestamp = null): Attendance
    {
        $now = $timestamp ?? Carbon::now();
        $today = $now->toDateString();

        $existing = Attendance::where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if ($existing && $existing->check_in) {
            throw ValidationException::withMessages([
                'check_in' => ['El usuario ya registró su entrada para la fecha de hoy.'],
            ]);
        }

        // Determine status dynamically based on company's shift start time and grace period
        $company = $user->company ?? Company::find($user->company_id);
        $startTime = $company?->work_start_time ?? '08:00:00';
        $graceMinutes = (int) ($company?->late_grace_minutes ?? 15);

        $timeParts = explode(':', $startTime);
        $startHour = (int) ($timeParts[0] ?? 8);
        $startMin = (int) ($timeParts[1] ?? 0);

        $scheduledStart = $now->copy()->setTime($startHour, $startMin, 0)->addMinutes($graceMinutes);
        $status = $now->greaterThan($scheduledStart) ? 'late' : 'present';

        if ($existing) {
            $existing->update([
                'check_in' => $now,
                'status' => $status,
                'notes' => $notes ?? $existing->notes,
            ]);
            return $existing;
        }

        return Attendance::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'date' => $today,
            'check_in' => $now,
            'status' => $status,
            'notes' => $notes,
        ]);
    }

    /**
     * Record Check-out for an employee.
     */
    public function checkOut(User $user, ?string $notes = null, ?Carbon $timestamp = null): Attendance
    {
        $now = $timestamp ?? Carbon::now();
        $today = $now->toDateString();

        $attendance = Attendance::where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if (! $attendance || ! $attendance->check_in) {
            throw ValidationException::withMessages([
                'check_out' => ['No existe un registro de entrada previo para el día de hoy.'],
            ]);
        }

        if ($attendance->check_out) {
            throw ValidationException::withMessages([
                'check_out' => ['El usuario ya registró su salida previamente hoy.'],
            ]);
        }

        $durationMinutes = $attendance->check_in->diffInMinutes($now);

        $attendance->update([
            'check_out' => $now,
            'work_duration_minutes' => $durationMinutes,
            'notes' => $notes ? trim(($attendance->notes ? $attendance->notes . ' | ' : '') . $notes) : $attendance->notes,
        ]);

        return $attendance;
    }

    /**
     * Register attendance novelty or manual status override (e.g. justified_absence, absent).
     */
    public function registerNovedad(int $companyId, int $userId, string $date, string $status, ?string $notes = null): Attendance
    {
        $validStatuses = ['present', 'late', 'absent', 'justified_absence'];
        if (! in_array($status, $validStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => ['Estado de asistencia no válido.'],
            ]);
        }

        return Attendance::updateOrCreate(
            [
                'company_id' => $companyId,
                'user_id' => $userId,
                'date' => $date,
            ],
            [
                'status' => $status,
                'notes' => $notes,
            ]
        );
    }

    /**
     * Get attendance records filtered by date range and/or employee.
     */
    public function getRecords(int $companyId, ?string $startDate = null, ?string $endDate = null, ?int $userId = null)
    {
        $query = Attendance::with('user:id,name,email')
            ->where('company_id', $companyId);

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->orderBy('date', 'desc')->orderBy('check_in', 'desc')->get();
    }

    /**
     * Get summary metrics for attendance.
     */
    public function getSummary(int $companyId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Attendance::where('company_id', $companyId);

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $records = $query->get();

        $totalRecords = $records->count();
        $present = $records->where('status', 'present')->count();
        $late = $records->where('status', 'late')->count();
        $absent = $records->where('status', 'absent')->count();
        $justified = $records->where('status', 'justified_absence')->count();

        $totalMinutesWorked = $records->sum('work_duration_minutes');
        $recordsWithDuration = $records->where('work_duration_minutes', '>', 0)->count();
        $averageHoursWorked = $recordsWithDuration > 0
            ? round(($totalMinutesWorked / $recordsWithDuration) / 60, 2)
            : 0;

        return [
            'total_records' => $totalRecords,
            'present_count' => $present,
            'late_count' => $late,
            'absent_count' => $absent,
            'justified_absence_count' => $justified,
            'total_hours_worked' => round($totalMinutesWorked / 60, 2),
            'average_daily_hours' => $averageHoursWorked,
        ];
    }
}
