<?php

namespace App\Http\Controllers\Api;

use App\Models\BankStatement;
use App\Services\BankReconciliationService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class BankReconciliationController extends BaseCrudController
{
    protected string $model = BankStatement::class;

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $statements = BankStatement::where('company_id', $companyId)
            ->withCount('items')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($statements);
    }

    public function import(Request $request, BankReconciliationService $service): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'file_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.date' => 'required|date',
            'items.*.concept' => 'required|string|max:255',
            'items.*.reference' => 'nullable|string|max:100',
            'items.*.amount' => 'required|numeric',
        ]);

        try {
            $statement = $service->importStatement(
                $companyId,
                [
                    'bank_name' => $validated['bank_name'],
                    'account_number' => $validated['account_number'] ?? null,
                    'file_name' => $validated['file_name'] ?? 'extracto.csv',
                ],
                $validated['items'],
                auth()->id()
            );

            return response()->json(['data' => $statement], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Request $request, string $id)
    {
        $companyId = $this->companyId($request);
        $statement = BankStatement::where('company_id', $companyId)
            ->with(['items.reconciliation.reconcilable', 'importer'])
            ->findOrFail($id);

        return response()->json(['data' => $statement]);
    }

    public function autoMatch(Request $request, string $id, BankReconciliationService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $statement = BankStatement::where('company_id', $companyId)->findOrFail($id);

        $result = $service->autoMatch($statement->id);

        return response()->json([
            'message' => 'Comparación automática ejecutada.',
            'data' => $result,
        ]);
    }

    public function manualMatch(Request $request, BankReconciliationService $service): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'bank_statement_item_id' => 'required|exists:bank_statement_items,id',
            'reconcilable_type' => 'required|string',
            'reconcilable_id' => 'required|integer',
            'notes' => 'nullable|string|max:255',
        ]);

        $reconciliation = $service->manualMatch(
            $companyId,
            $validated['bank_statement_item_id'],
            $validated['reconcilable_type'],
            $validated['reconcilable_id'],
            $validated['notes'] ?? null,
            auth()->id()
        );

        return response()->json(['data' => $reconciliation->load('statementItem')], 200);
    }

    public function unmatch(Request $request, string $id, BankReconciliationService $service): JsonResponse
    {
        $companyId = $this->companyId($request);

        $service->unmatch((int) $id);

        return response()->json(['message' => 'Conciliación deshecha correctamente.']);
    }

    public function report(Request $request, string $id, BankReconciliationService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $statement = BankStatement::where('company_id', $companyId)->findOrFail($id);

        $report = $service->getSummaryReport($statement->id);

        return response()->json(['data' => $report]);
    }
}
