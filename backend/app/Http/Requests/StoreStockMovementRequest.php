<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreStockMovementRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

        return [
            'product_id' => ['required', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['required', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'type' => ['required', 'in:in,out,adjustment,COMPRA,VENTA,DEVOLUCION_COMPRA,DEVOLUCION_VENTA,AJUSTE_ENTRADA,AJUSTE_SALIDA,TRASLADO,CONSUMO_CLINICO'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * El signo de `quantity` codifica el sentido del movimiento: una salida
     * siempre resta del stock (SUM(quantity) por producto+bodega). El usuario
     * solo captura una cantidad positiva; el signo lo decide el tipo.
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        if (is_array($data)) {
            if (in_array($data['type'] ?? null, ['out', 'VENTA', 'DEVOLUCION_COMPRA', 'AJUSTE_SALIDA', 'CONSUMO_CLINICO'], true)) {
                $data['quantity'] = -abs((int) ($data['quantity'] ?? 0));
            } else {
                $data['quantity'] = abs((int) ($data['quantity'] ?? 0));
            }
        }

        return $data;
    }

    protected function passedValidation(): void
    {
        if (in_array($this->input('type'), ['out', 'VENTA', 'DEVOLUCION_COMPRA', 'AJUSTE_SALIDA', 'CONSUMO_CLINICO'], true)) {
            $this->merge(['quantity' => -abs((int) $this->input('quantity'))]);
        } else {
            $this->merge(['quantity' => abs((int) $this->input('quantity'))]);
        }
    }
}
