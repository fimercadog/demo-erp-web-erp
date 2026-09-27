<?php

namespace App\Services;

use App\Models\BankReconciliation;
use App\Models\BankStatement;
use App\Models\BankStatementItem;
use App\Models\CashMovement;
use App\Models\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BankReconciliationService
{
    /**
     * Import a bank statement with items.
     */
    public function importStatement(int $companyId, array $header, array $itemsData, ?int $userId = null): BankStatement
    {
        if (empty($itemsData)) {
            throw new InvalidArgumentException('El extracto bancario debe contener al menos un movimiento.');
        }

        return DB::transaction(function () use ($companyId, $header, $itemsData, $userId) {
            $totalDebits = 0.0;
            $totalCredits = 0.0;
            $dates = [];

            foreach ($itemsData as $item) {
                $amount = (float) $item['amount'];
                if ($amount >= 0) {
                    $totalCredits += $amount;
                } else {
                    $totalDebits += abs($amount);
                }
                if (! empty($item['date'])) {
                    $dates[] = Carbon::parse($item['date'])->toDateString();
                }
            }

            sort($dates);
            $startDate = ! empty($dates) ? $dates[0] : now()->toDateString();
            $endDate = ! empty($dates) ? end($dates) : now()->toDateString();

            $statement = BankStatement::create([
                'company_id' => $companyId,
                'bank_name' => $header['bank_name'] ?? 'Banco General',
                'account_number' => $header['account_number'] ?? null,
                'file_name' => $header['file_name'] ?? 'extracto_bancario.csv',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_items' => count($itemsData),
                'total_debits' => $totalDebits,
                'total_credits' => $totalCredits,
                'status' => 'pending',
                'imported_by' => $userId,
            ]);

            foreach ($itemsData as $item) {
                $rawAmount = (float) $item['amount'];
                BankStatementItem::create([
                    'bank_statement_id' => $statement->id,
                    'date' => $item['date'] ?? now()->toDateString(),
                    'concept' => $item['concept'] ?? 'Movimiento bancario',
                    'reference' => $item['reference'] ?? null,
                    'amount' => abs($rawAmount),
                    'type' => $rawAmount >= 0 ? 'credit' : 'debit',
                    'status' => 'unreconciled',
                ]);
            }

            return $statement->load('items');
        });
    }

    /**
     * Run automatic comparison between extract items and ERP movements.
     */
    public function autoMatch(int $statementId): array
    {
        $statement = BankStatement::with('items')->findOrFail($statementId);
        $companyId = $statement->company_id;

        $unreconciledItems = $statement->items->where('status', 'unreconciled');
        $matchedCount = 0;
        $discrepancyCount = 0;

        foreach ($unreconciledItems as $item) {
            $itemDate = Carbon::parse($item->date);
            $itemAmount = (float) $item->amount;

            // Search in Payments
            $paymentMatch = Payment::whereHas('cashSession', function ($q) use ($companyId) {
                // payment cash session company scope or payable company scope
            })
            ->where('amount', $itemAmount)
            ->whereBetween('created_at', [$itemDate->copy()->subDays(3)->startOfDay(), $itemDate->copy()->addDays(3)->endOfDay()])
            ->whereDoesntHave('reconciliation')
            ->first();

            if (! $paymentMatch) {
                // Fallback search in CashMovements
                $cashMatch = CashMovement::whereHas('session', function ($q) use ($companyId) {
                    $q->whereHas('register', function ($r) use ($companyId) {
                        $r->where('company_id', $companyId);
                    });
                })
                ->where('amount', $itemAmount)
                ->whereBetween('created_at', [$itemDate->copy()->subDays(3)->startOfDay(), $itemDate->copy()->addDays(3)->endOfDay()])
                ->whereDoesntHave('reconciliation')
                ->first();

                if ($cashMatch) {
                    $this->createReconciliationRecord($companyId, $item, CashMovement::class, $cashMatch->id, 'exact', 0);
                    $matchedCount++;
                    continue;
                }
            } else {
                $this->createReconciliationRecord($companyId, $item, Payment::class, $paymentMatch->id, 'exact', 0);
                $matchedCount++;
                continue;
            }
        }

        $this->updateStatementStatus($statement);

        return [
            'total_processed' => count($unreconciledItems),
            'matched' => $matchedCount,
            'discrepancies' => $discrepancyCount,
            'remaining_unreconciled' => $statement->items()->where('status', 'unreconciled')->count(),
        ];
    }

    /**
     * Manually reconcile a statement item with an ERP record.
     */
    public function manualMatch(int $companyId, int $statementItemId, string $reconcilableType, int $reconcilableId, ?string $notes = null, ?int $userId = null): BankReconciliation
    {
        $item = BankStatementItem::findOrFail($statementItemId);

        // Calculate discrepancy if any
        $erpAmount = 0.0;
        if ($reconcilableType === Payment::class || str_contains($reconcilableType, 'Payment')) {
            $record = Payment::findOrFail($reconcilableId);
            $erpAmount = (float) $record->amount;
            $reconcilableType = Payment::class;
        } elseif ($reconcilableType === CashMovement::class || str_contains($reconcilableType, 'CashMovement')) {
            $record = CashMovement::findOrFail($reconcilableId);
            $erpAmount = (float) $record->amount;
            $reconcilableType = CashMovement::class;
        }

        $diff = abs((float) $item->amount - $erpAmount);
        $matchType = $diff < 0.01 ? 'exact' : 'manual';

        $reconciliation = $this->createReconciliationRecord(
            $companyId,
            $item,
            $reconcilableType,
            $reconcilableId,
            $matchType,
            $diff,
            $notes,
            $userId
        );

        $this->updateStatementStatus($item->statement);

        return $reconciliation;
    }

    /**
     * Remove a reconciliation match.
     */
    public function unmatch(int $reconciliationId): void
    {
        $rec = BankReconciliation::with('statementItem.statement')->findOrFail($reconciliationId);
        $item = $rec->statementItem;
        $statement = $item->statement;

        $rec->delete();

        $item->update(['status' => 'unreconciled']);
        $this->updateStatementStatus($statement);
    }

    /**
     * Get summary reconciliation report.
     */
    public function getSummaryReport(int $statementId): array
    {
        $statement = BankStatement::with(['items.reconciliation.reconcilable'])->findOrFail($statementId);
        $companyId = $statement->company_id;

        $totalItems = $statement->items->count();
        $reconciledItems = $statement->items->whereIn('status', ['reconciled', 'discrepancy']);
        $unreconciledItems = $statement->items->where('status', 'unreconciled');

        $reconciledCount = $reconciledItems->count();
        $unreconciledCount = $unreconciledItems->count();

        $totalExtractAmount = (float) $statement->items->sum('amount');
        $reconciledAmount = (float) $reconciledItems->sum('amount');
        $unreconciledAmount = (float) $unreconciledItems->sum('amount');

        // Unreconciled ERP Cash Movements for comparison
        $pendingErpMovements = CashMovement::whereHas('session.register', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        })
        ->whereDoesntHave('reconciliation')
        ->whereBetween('created_at', [
            Carbon::parse($statement->start_date)->startOfDay(),
            Carbon::parse($statement->end_date)->endOfDay(),
        ])
        ->get(['id', 'type', 'amount', 'concept', 'created_at']);

        return [
            'statement' => [
                'id' => $statement->id,
                'bank_name' => $statement->bank_name,
                'account_number' => $statement->account_number,
                'status' => $statement->status,
                'start_date' => $statement->start_date?->toDateString(),
                'end_date' => $statement->end_date?->toDateString(),
            ],
            'metrics' => [
                'total_extract_items' => $totalItems,
                'reconciled_items_count' => $reconciledCount,
                'unreconciled_items_count' => $unreconciledCount,
                'total_extract_amount' => $totalExtractAmount,
                'reconciled_amount' => $reconciledAmount,
                'unreconciled_amount' => $unreconciledAmount,
                'pending_erp_movements_count' => $pendingErpMovements->count(),
                'pending_erp_movements_total' => (float) $pendingErpMovements->sum('amount'),
            ],
            'pending_erp_movements' => $pendingErpMovements,
            'items' => $statement->items,
        ];
    }

    private function createReconciliationRecord(
        int $companyId,
        BankStatementItem $item,
        string $type,
        int $id,
        string $matchType,
        float $diff,
        ?string $notes = null,
        ?int $userId = null
    ): BankReconciliation {
        // Remove old reconciliation if any
        BankReconciliation::where('bank_statement_item_id', $item->id)->delete();

        $rec = BankReconciliation::create([
            'company_id' => $companyId,
            'bank_statement_item_id' => $item->id,
            'reconcilable_type' => $type,
            'reconcilable_id' => $id,
            'match_type' => $matchType,
            'amount_difference' => $diff,
            'notes' => $notes,
            'reconciled_by' => $userId,
            'reconciled_at' => now(),
        ]);

        $item->update(['status' => $diff > 0.01 ? 'discrepancy' : 'reconciled']);

        return $rec;
    }

    private function updateStatementStatus(BankStatement $statement): void
    {
        $total = $statement->items()->count();
        $reconciled = $statement->items()->whereIn('status', ['reconciled', 'discrepancy'])->count();

        if ($reconciled === 0) {
            $status = 'pending';
        } elseif ($reconciled === $total) {
            $status = 'reconciled';
        } else {
            $status = 'partially_reconciled';
        }

        $statement->update(['status' => $status]);
    }
}
