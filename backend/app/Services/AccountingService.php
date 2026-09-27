<?php

namespace App\Services;

use App\Models\AccountChart;
use App\Models\JournalEntry;
use App\Models\JournalEntryItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AccountingService
{
    /**
     * Seed default Plan Único de Cuentas (PUC) for a company if not existing.
     */
    public function seedDefaultChartOfAccounts(?int $companyId = null): void
    {
        $defaultAccounts = [
            ['code' => '1', 'name' => 'ACTIVO', 'type' => 'asset', 'parent_code' => null],
            ['code' => '11', 'name' => 'EFECTIVO Y EQUIVALENTES DE EFECTIVO', 'type' => 'asset', 'parent_code' => '1'],
            ['code' => '1105', 'name' => 'Caja General', 'type' => 'asset', 'parent_code' => '11'],
            ['code' => '1110', 'name' => 'Bancos', 'type' => 'asset', 'parent_code' => '11'],
            ['code' => '13', 'name' => 'DEUDORES / CUENTAS POR COBRAR', 'type' => 'asset', 'parent_code' => '1'],
            ['code' => '1305', 'name' => 'Clientes / Clientes Nacionales', 'type' => 'asset', 'parent_code' => '13'],

            ['code' => '2', 'name' => 'PASIVO', 'type' => 'liability', 'parent_code' => null],
            ['code' => '22', 'name' => 'PROVEEDORES / CUENTAS POR PAGAR', 'type' => 'liability', 'parent_code' => '2'],
            ['code' => '2205', 'name' => 'Nacionales / Proveedores', 'type' => 'liability', 'parent_code' => '22'],

            ['code' => '3', 'name' => 'PATRIMONIO', 'type' => 'equity', 'parent_code' => null],
            ['code' => '31', 'name' => 'CAPITAL SOCIAL', 'type' => 'equity', 'parent_code' => '3'],
            ['code' => '3105', 'name' => 'Capital Suscrito y Pagado', 'type' => 'equity', 'parent_code' => '31'],

            ['code' => '4', 'name' => 'INGRESOS', 'type' => 'revenue', 'parent_code' => null],
            ['code' => '41', 'name' => 'OPERACIONALES', 'type' => 'revenue', 'parent_code' => '4'],
            ['code' => '4135', 'name' => 'Comercio al por Mayor y al por Menor / Ventas', 'type' => 'revenue', 'parent_code' => '41'],

            ['code' => '5', 'name' => 'GASTOS', 'type' => 'expense', 'parent_code' => null],
            ['code' => '51', 'name' => 'OPERACIONALES DE ADMINISTRACIÓN', 'type' => 'expense', 'parent_code' => '5'],
            ['code' => '5105', 'name' => 'Gastos de Personal / Nómina', 'type' => 'expense', 'parent_code' => '51'],
            ['code' => '5195', 'name' => 'Diversos / Gastos Generales', 'type' => 'expense', 'parent_code' => '51'],
        ];

        $codeToIdMap = [];

        foreach ($defaultAccounts as $acc) {
            $parentId = isset($acc['parent_code']) && isset($codeToIdMap[$acc['parent_code']])
                ? $codeToIdMap[$acc['parent_code']]
                : null;

            $account = AccountChart::updateOrCreate(
                [
                    'company_id' => $companyId,
                    'code' => $acc['code'],
                ],
                [
                    'name' => $acc['name'],
                    'type' => $acc['type'],
                    'parent_id' => $parentId,
                    'is_active' => true,
                ]
            );

            $codeToIdMap[$acc['code']] = $account->id;
        }
    }

    /**
     * Create a new Journal Entry with balanced items check.
     */
    public function createEntry(array $data): JournalEntry
    {
        $itemsData = $data['items'] ?? [];
        if (empty($itemsData)) {
            throw new InvalidArgumentException('El asiento contable debe contener al menos un detalle de débito/crédito.');
        }

        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($itemsData as $item) {
            $totalDebit += (float) ($item['debit'] ?? 0);
            $totalCredit += (float) ($item['credit'] ?? 0);
        }

        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw new InvalidArgumentException(sprintf('El asiento contable no está balanceado. Total Débito: %.2f, Total Crédito: %.2f', $totalDebit, $totalCredit));
        }

        return DB::transaction(function () use ($data, $itemsData) {
            $entryNumber = $data['entry_number'] ?? ('AS-' . date('Ymd') . '-' . rand(1000, 9999));

            $entry = JournalEntry::create([
                'company_id' => $data['company_id'],
                'entry_number' => $entryNumber,
                'date' => $data['date'] ?? now()->toDateString(),
                'concept' => $data['concept'],
                'reference' => $data['reference'] ?? null,
                'status' => $data['status'] ?? 'posted',
                'created_by' => $data['created_by'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                JournalEntryItem::create([
                    'journal_entry_id' => $entry->id,
                    'account_chart_id' => $item['account_chart_id'],
                    'debit' => $item['debit'] ?? 0,
                    'credit' => $item['credit'] ?? 0,
                    'description' => $item['description'] ?? null,
                ]);
            }

            return $entry->load(['items.account']);
        });
    }

    /**
     * Get Trial Balance (Balance de Comprobación).
     */
    public function getTrialBalance(int $companyId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $this->seedDefaultChartOfAccounts($companyId);

        $accounts = AccountChart::where('company_id', $companyId)
            ->orWhereNull('company_id')
            ->orderBy('code')
            ->get();

        $query = JournalEntryItem::query()
            ->join('journal_entries', 'journal_entry_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journal_entries.status', 'posted');

        if ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $sums = $query->select(
            'journal_entry_items.account_chart_id',
            DB::raw('SUM(journal_entry_items.debit) as total_debit'),
            DB::raw('SUM(journal_entry_items.credit) as total_credit')
        )
        ->groupBy('journal_entry_items.account_chart_id')
        ->get()
        ->keyBy('account_chart_id');

        return $accounts->map(function ($account) use ($sums) {
            $sum = $sums->get($account->id);
            $debit = $sum ? (float) $sum->total_debit : 0.0;
            $credit = $sum ? (float) $sum->total_credit : 0.0;

            // Balance based on account type
            $balance = in_array($account->type, ['asset', 'expense'])
                ? $debit - $credit
                : $credit - $debit;

            return [
                'account_id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'total_debit' => $debit,
                'total_credit' => $credit,
                'balance' => $balance,
            ];
        });
    }

    /**
     * Get General Ledger (Libro Mayor) for a specific account.
     */
    public function getGeneralLedger(int $companyId, int $accountId, ?string $startDate = null, ?string $endDate = null): array
    {
        $account = AccountChart::findOrFail($accountId);

        $query = JournalEntryItem::query()
            ->with(['entry'])
            ->join('journal_entries', 'journal_entry_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journal_entry_items.account_chart_id', $accountId)
            ->where('journal_entries.status', 'posted');

        if ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $items = $query->orderBy('journal_entries.date')
            ->orderBy('journal_entries.id')
            ->get([
                'journal_entry_items.*',
                'journal_entries.entry_number',
                'journal_entries.date as entry_date',
                'journal_entries.concept',
                'journal_entries.reference',
            ]);

        $runningBalance = 0.0;
        $movementList = [];

        foreach ($items as $item) {
            $debit = (float) $item->debit;
            $credit = (float) $item->credit;

            if (in_array($account->type, ['asset', 'expense'])) {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }

            $movementList[] = [
                'item_id' => $item->id,
                'entry_number' => $item->entry_number,
                'date' => $item->entry_date,
                'concept' => $item->concept,
                'reference' => $item->reference,
                'description' => $item->description,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
            ];
        }

        return [
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
            ],
            'total_debit' => (float) $items->sum('debit'),
            'total_credit' => (float) $items->sum('credit'),
            'ending_balance' => $runningBalance,
            'movements' => $movementList,
        ];
    }
}
