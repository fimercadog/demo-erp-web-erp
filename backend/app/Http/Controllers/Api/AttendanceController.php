<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService)
    {
    }

    /**
     * Check-in logged in user or specified user.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $attendance = $this->attendanceService->checkIn($user, $request->input('notes'));

        return response()->json([
            'message' => 'Entrada registrada exitosamente.',
            'data' => $attendance->load('user:id,name,email'),
        ]);
    }

    /**
     * Check-out logged in user.
     */
    public function checkOut(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $attendance = $this->attendanceService->checkOut($user, $request->input('notes'));

        return response()->json([
            'message' => 'Salida registrada exitosamente.',
            'data' => $attendance->load('user:id,name,email'),
        ]);
    }

    /**
     * Register attendance novelty or manual record.
     */
    public function registerNovedad(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'status' => 'required|string|in:present,late,absent,justified_absence',
            'notes' => 'nullable|string|max:500',
        ]);

        $companyId = Auth::user()->company_id;

        $attendance = $this->attendanceService->registerNovedad(
            $companyId,
            $validated['user_id'],
            $validated['date'],
            $validated['status'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Novedad de asistencia registrada exitosamente.',
            'data' => $attendance->load('user:id,name,email'),
        ]);
    }

    /**
     * Get attendance records.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = Auth::user()->company_id;
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $userId = $request->query('user_id') ? (int) $request->query('user_id') : null;

        $records = $this->attendanceService->getRecords($companyId, $startDate, $endDate, $userId);

        return response()->json([
            'data' => $records,
        ]);
    }

    /**
     * Get today's status for current logged-in user.
     */
    public function currentStatus(): JsonResponse
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $attendance = Attendance::where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        return response()->json([
            'data' => [
                'has_checked_in' => (bool) ($attendance && $attendance->check_in),
                'has_checked_out' => (bool) ($attendance && $attendance->check_out),
                'attendance' => $attendance,
            ],
        ]);
    }

    /**
     * Get summary metrics.
     */
    public function summary(Request $request): JsonResponse
    {
        $companyId = Auth::user()->company_id;
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $summary = $this->attendanceService->getSummary($companyId, $startDate, $endDate);

        return response()->json([
            'data' => $summary,
        ]);
    }
}
