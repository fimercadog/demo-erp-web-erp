<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class VeterinaryConsultationLogicTest extends TestCase
{
    public function test_classification_of_clinical_items(): void
    {
        $items = [
            [
                'name' => 'Consulta Especializada',
                'type' => 'service',
                'is_inventoriable' => false,
                'is_billable' => true,
                'unit_price' => 80000.00,
                'quantity' => 1,
            ],
            [
                'name' => 'Meloxicam 10ml',
                'type' => 'medication',
                'is_inventoriable' => true,
                'is_billable' => true,
                'unit_price' => 35000.00,
                'quantity' => 1,
            ],
            [
                'name' => 'Jeringa 3ml desechable',
                'type' => 'supply',
                'is_inventoriable' => true,
                'is_billable' => false, // Insumo incluido en procedimiento
                'unit_price' => 0.00,
                'quantity' => 2,
            ],
            [
                'name' => 'Revisión y vendaje informativo',
                'type' => 'note',
                'is_inventoriable' => false,
                'is_billable' => false,
                'unit_price' => 0.00,
                'quantity' => 1,
            ],
        ];

        // 1. Elementos que descuentan inventario
        $stockOutItems = array_filter($items, fn ($it) => $it['is_inventoriable']);
        $this->assertCount(2, $stockOutItems); // Meloxicam + Jeringas

        // 2. Elementos que generan cargos en Factura ERP
        $billableItems = array_filter($items, fn ($it) => $it['is_billable'] && $it['unit_price'] > 0);
        $this->assertCount(2, $billableItems); // Consulta + Meloxicam

        // 3. Cálculo de total a facturar
        $totalToBill = 0.0;
        foreach ($billableItems as $b) {
            $totalToBill += round($b['quantity'] * $b['unit_price'], 2);
        }

        // 80.000 + 35.000 = 115.000 (Las jeringas de $0 no alteran el total)
        $this->assertEquals(115000.00, $totalToBill);
    }

    public function test_included_supplies_do_not_duplicate_charges(): void
    {
        $procedurePrice = 150000.00; // Curación quirúrgica menor con insumos incluidos
        $supplies = [
            ['name' => 'Gasas estériles', 'cost' => 2500.00, 'qty' => 3, 'billable' => false],
            ['name' => 'Solución antiséptica', 'cost' => 4000.00, 'qty' => 1, 'billable' => false],
            ['name' => 'Venda elástica', 'cost' => 5500.00, 'qty' => 1, 'billable' => false],
        ];

        $totalBillable = $procedurePrice;
        $inventoryCostTotal = 0.0;

        foreach ($supplies as $sup) {
            $inventoryCostTotal += $sup['cost'] * $sup['qty'];
            if ($sup['billable']) {
                $totalBillable += 10000.00;
            }
        }

        // Costo interno de insumos: (2500 * 3) + 4000 + 5500 = 7500 + 4000 + 5500 = 17000
        $this->assertEquals(17000.00, $inventoryCostTotal);
        // Total cobrado al cliente sigue siendo exactamente la tarifa pactada del procedimiento ($150.000)
        $this->assertEquals(150000.00, $totalBillable);
    }
}
