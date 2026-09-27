<?php

namespace App\Services;

use App\Models\AccountPayable;
use App\Models\AccountReceivable;
use Carbon\Carbon;

class AccountsService
{
    /**
     * Reporte de antigüedad de cartera de Cuentas por Cobrar (CxC)
     *
     * @return array<string, mixed>
     */
    public function getReceivablesAging(int $companyId, ?string $asOfDate = null): array
    {
        $refDate = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : now()->startOfDay();

        $records = AccountReceivable::query()
            ->where('company_id', $companyId)
            ->where('balance', '>', 0)
            ->with(['client:id,name,email', 'invoice:id,number,total'])
            ->get();

        $byClient = [];

        $grandTotals = [
            'current' => 0.0,
            'days_1_30' => 0.0,
            'days_31_60' => 0.0,
            'days_61_90' => 0.0,
            'days_91_plus' => 0.0,
            'total_balance' => 0.0,
            'count' => 0,
        ];

        foreach ($records as $item) {
            $clientId = $item->client_id;
            $clientName = $item->client?->name ?? 'Cliente #'.$clientId;
            $balance = (float) $item->balance;

            if (! isset($byClient[$clientId])) {
                $byClient[$clientId] = [
                    'client_id' => $clientId,
                    'client_name' => $clientName,
                    'current' => 0.0,
                    'days_1_30' => 0.0,
                    'days_31_60' => 0.0,
                    'days_61_90' => 0.0,
                    'days_91_plus' => 0.0,
                    'total_balance' => 0.0,
                    'count' => 0,
                ];
            }

            $bucket = $this->resolveBucket($item->due_date, $refDate);

            $byClient[$clientId][$bucket] += $balance;
            $byClient[$clientId]['total_balance'] += $balance;
            $byClient[$clientId]['count']++;

            $grandTotals[$bucket] += $balance;
            $grandTotals['total_balance'] += $balance;
            $grandTotals['count']++;
        }

        // Format decimal values
        foreach ($byClient as &$clientData) {
            $clientData['current'] = round($clientData['current'], 2);
            $clientData['days_1_30'] = round($clientData['days_1_30'], 2);
            $clientData['days_31_60'] = round($clientData['days_31_60'], 2);
            $clientData['days_61_90'] = round($clientData['days_61_90'], 2);
            $clientData['days_91_plus'] = round($clientData['days_91_plus'], 2);
            $clientData['total_balance'] = round($clientData['total_balance'], 2);
        }

        return [
            'as_of_date' => $refDate->toDateString(),
            'by_client' => array_values($byClient),
            'totals' => [
                'current' => round($grandTotals['current'], 2),
                'days_1_30' => round($grandTotals['days_1_30'], 2),
                'days_31_60' => round($grandTotals['days_31_60'], 2),
                'days_61_90' => round($grandTotals['days_61_90'], 2),
                'days_91_plus' => round($grandTotals['days_91_plus'], 2),
                'total_balance' => round($grandTotals['total_balance'], 2),
                'count' => $grandTotals['count'],
            ],
        ];
    }

    /**
     * Reporte de antigüedad de cartera de Cuentas por Pagar (CxP)
     *
     * @return array<string, mixed>
     */
    public function getPayablesAging(int $companyId, ?string $asOfDate = null): array
    {
        $refDate = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : now()->startOfDay();

        $records = AccountPayable::query()
            ->where('company_id', $companyId)
            ->where('balance', '>', 0)
            ->with(['supplier:id,name', 'purchaseOrder:id,number'])
            ->get();

        $bySupplier = [];

        $grandTotals = [
            'current' => 0.0,
            'days_1_30' => 0.0,
            'days_31_60' => 0.0,
            'days_61_90' => 0.0,
            'days_91_plus' => 0.0,
            'total_balance' => 0.0,
            'count' => 0,
        ];

        foreach ($records as $item) {
            $supplierId = $item->supplier_id;
            $supplierName = $item->supplier?->name ?? 'Proveedor #'.$supplierId;
            $balance = (float) $item->balance;

            if (! isset($bySupplier[$supplierId])) {
                $bySupplier[$supplierId] = [
                    'supplier_id' => $supplierId,
                    'supplier_name' => $supplierName,
                    'current' => 0.0,
                    'days_1_30' => 0.0,
                    'days_31_60' => 0.0,
                    'days_61_90' => 0.0,
                    'days_91_plus' => 0.0,
                    'total_balance' => 0.0,
                    'count' => 0,
                ];
            }

            $bucket = $this->resolveBucket($item->due_date, $refDate);

            $bySupplier[$supplierId][$bucket] += $balance;
            $bySupplier[$supplierId]['total_balance'] += $balance;
            $bySupplier[$supplierId]['count']++;

            $grandTotals[$bucket] += $balance;
            $grandTotals['total_balance'] += $balance;
            $grandTotals['count']++;
        }

        foreach ($bySupplier as &$supplierData) {
            $supplierData['current'] = round($supplierData['current'], 2);
            $supplierData['days_1_30'] = round($supplierData['days_1_30'], 2);
            $supplierData['days_31_60'] = round($supplierData['days_31_60'], 2);
            $supplierData['days_61_90'] = round($supplierData['days_61_90'], 2);
            $supplierData['days_91_plus'] = round($supplierData['days_91_plus'], 2);
            $supplierData['total_balance'] = round($supplierData['total_balance'], 2);
        }

        return [
            'as_of_date' => $refDate->toDateString(),
            'by_supplier' => array_values($bySupplier),
            'totals' => [
                'current' => round($grandTotals['current'], 2),
                'days_1_30' => round($grandTotals['days_1_30'], 2),
                'days_31_60' => round($grandTotals['days_31_60'], 2),
                'days_61_90' => round($grandTotals['days_61_90'], 2),
                'days_91_plus' => round($grandTotals['days_91_plus'], 2),
                'total_balance' => round($grandTotals['total_balance'], 2),
                'count' => $grandTotals['count'],
            ],
        ];
    }

    /**
     * Resumen de indicadores KPI de Cuentas por Cobrar
     *
     * @return array<string, mixed>
     */
    public function getReceivablesSummary(int $companyId): array
    {
        $query = AccountReceivable::query()->where('company_id', $companyId);

        $totalOriginal = (float) (clone $query)->sum('original_amount');
        $totalPaid = (float) (clone $query)->sum('paid_amount');
        $totalBalance = (float) (clone $query)->sum('balance');

        $overdueQuery = (clone $query)
            ->where('balance', '>', 0)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString());

        $overdueBalance = (float) (clone $overdueQuery)->sum('balance');
        $overdueCount = (int) (clone $overdueQuery)->count();

        $pendingCount = (int) (clone $query)->where('balance', '>', 0)->count();
        $paidCount = (int) (clone $query)->where('balance', '<=', 0)->count();
        $totalCount = (int) (clone $query)->count();

        return [
            'total_original' => round($totalOriginal, 2),
            'total_paid' => round($totalPaid, 2),
            'total_balance' => round($totalBalance, 2),
            'overdue_balance' => round($overdueBalance, 2),
            'total_count' => $totalCount,
            'pending_count' => $pendingCount,
            'overdue_count' => $overdueCount,
            'paid_count' => $paidCount,
        ];
    }

    /**
     * Resumen de indicadores KPI de Cuentas por Pagar
     *
     * @return array<string, mixed>
     */
    public function getPayablesSummary(int $companyId): array
    {
        $query = AccountPayable::query()->where('company_id', $companyId);

        $totalOriginal = (float) (clone $query)->sum('original_amount');
        $totalPaid = (float) (clone $query)->sum('paid_amount');
        $totalBalance = (float) (clone $query)->sum('balance');

        $overdueQuery = (clone $query)
            ->where('balance', '>', 0)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString());

        $overdueBalance = (float) (clone $overdueQuery)->sum('balance');
        $overdueCount = (int) (clone $overdueQuery)->count();

        $pendingCount = (int) (clone $query)->where('balance', '>', 0)->count();
        $paidCount = (int) (clone $query)->where('balance', '<=', 0)->count();
        $totalCount = (int) (clone $query)->count();

        return [
            'total_original' => round($totalOriginal, 2),
            'total_paid' => round($totalPaid, 2),
            'total_balance' => round($totalBalance, 2),
            'overdue_balance' => round($overdueBalance, 2),
            'total_count' => $totalCount,
            'pending_count' => $pendingCount,
            'overdue_count' => $overdueCount,
            'paid_count' => $paidCount,
        ];
    }

    private function resolveBucket(?Carbon $dueDate, Carbon $refDate): string
    {
        if (! $dueDate || $dueDate->greaterThanOrEqualTo($refDate)) {
            return 'current';
        }

        $days = (int) $dueDate->diffInDays($refDate);

        if ($days <= 30) {
            return 'days_1_30';
        }
        if ($days <= 60) {
            return 'days_31_60';
        }
        if ($days <= 90) {
            return 'days_61_90';
        }

        return 'days_91_plus';
    }
}
