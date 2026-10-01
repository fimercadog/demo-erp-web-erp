<?php

namespace App\Services;

class ErpTotals
{
    /**
     * @param  array<int, array{quantity:int|float, unit_price?:int|float, unit_cost?:int|float, discount?:int|float, tax?:int|float}>  $items
     * @return array{subtotal:float, discount:float, tax:float, total:float, items:array<int, array<string, float|int>>}
     */
    public function calculate(array $items): array
    {
        $rows = [];
        $subtotal = 0.0;
        $discount = 0.0;
        $tax = 0.0;

        foreach ($items as $item) {
            $quantity = (float) $item['quantity'];
            $unit = (float) ($item['unit_price'] ?? $item['unit_cost'] ?? 0);
            $lineDiscount = (float) ($item['discount'] ?? 0);
            $lineTax = (float) ($item['tax'] ?? 0);
            $lineSubtotal = round($quantity * $unit, 2);
            $lineTotal = round($lineSubtotal - $lineDiscount + $lineTax, 2);

            $subtotal += $lineSubtotal;
            $discount += $lineDiscount;
            $tax += $lineTax;
            $rows[] = $item + [
                'quantity' => $quantity,
                'discount' => $lineDiscount,
                'tax' => $lineTax,
                'line_total' => $lineTotal,
            ];
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'tax' => round($tax, 2),
            'total' => round($subtotal - $discount + $tax, 2),
            'items' => $rows,
        ];
    }
}
