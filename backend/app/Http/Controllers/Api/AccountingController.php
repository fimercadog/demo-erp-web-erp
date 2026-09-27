<?php

namespace App\Http\Controllers\Api;

use App\Models\AccountChart;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountingController extends BaseCrudController
{
    protected string $model = JournalEntry::class;

    public function getChart(Request $request, AccountingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $service->seedDefaultChartOfAccounts($companyId);

        $accounts = AccountChart::where('company_id', $companyId)
            ->orWhereNull('company_id')
            ->orderBy('code')
            ->get();

        return response()->json(['data' => $accounts]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id' => 'nullable|exists:account_charts,id',
            'is_active' => 'boolean',
        ]);

        $account = AccountChart::updateOrCreate(
            [
                'company_id' => $companyId,
                'code' => $validated['code'],
            ],
            [
                'name' => $validated['name'],
                'type' => $validated['type'],
                'parent_id' => $validated['parent_id'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]
        );

        return response()->json(['data' => $account], 201);
    }

    public function getEntries(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $query = JournalEntry::with(['items.account', 'creator'])
            ->where('company_id', $companyId);

        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->input('end_date'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('entry_number', 'like', "%{$search}%")
                  ->orWhere('concept', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $entries = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($entries);
    }

    public function storeEntry(Request $request, AccountingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'date' => 'required|date',
            'concept' => 'required|string|max:255',
            'reference' => 'nullable|string|max:100',
            'entry_number' => 'nullable|string|max:50',
            'items' => 'required|array|min:2',
            'items.*.account_chart_id' => 'required|exists:account_charts,id',
            'items.*.debit' => 'nullable|numeric|min:0',
            'items.*.credit' => 'nullable|numeric|min:0',
            'items.*.description' => 'nullable|string|max:255',
        ]);

        $validated['company_id'] = $companyId;
        $validated['created_by'] = auth()->id();

        try {
            $entry = $service->createEntry($validated);
            return response()->json(['data' => $entry], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function getTrialBalance(Request $request, AccountingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $report = $service->getTrialBalance($companyId, $startDate, $endDate);

        return response()->json([
            'data' => $report,
            'summary' => [
                'total_debit' => $report->sum('total_debit'),
                'total_credit' => $report->sum('total_credit'),
                'is_balanced' => abs($report->sum('total_debit') - $report->sum('total_credit')) < 0.01,
            ],
        ]);
    }

    public function getGeneralLedger(Request $request, AccountingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $request->validate([
            'account_id' => 'required|exists:account_charts,id',
        ]);

        $accountId = (int) $request->input('account_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $report = $service->getGeneralLedger($companyId, $accountId, $startDate, $endDate);

        return response()->json(['data' => $report]);
    }
}
