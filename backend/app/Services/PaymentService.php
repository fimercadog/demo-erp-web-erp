<?php

namespace App\Services;

use App\Models\AccountPayable;
use App\Models\AccountReceivable;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data, int $companyId, int $userId): Payment
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            if (! empty($data['idempotency_key'])) {
                $existing = Payment::query()->where('company_id', $companyId)->where('idempotency_key', $data['idempotency_key'])->first();
                if ($existing) {
                    return $existing->load('payable', 'cashMovement');
                }
            }

            $account = $this->resolveAccount($data['target_type'], (int) $data['target_id'], $companyId);
            $amount = round((float) $data['amount'], 2);
            if ($amount <= 0 || $amount > (float) $account->balance) {
                throw ValidationException::withMessages(['amount' => 'El valor del pago debe ser mayor a cero y no superar el saldo.']);
            }

            $method = $data['method'] ?? 'cash';
            $cashSessionId = ! empty($data['cash_session_id']) ? (int) $data['cash_session_id'] : null;

            if ($method === 'cash' && ! $cashSessionId) {
                throw ValidationException::withMessages([
                    'cash_session_id' => 'Los pagos en efectivo requieren obligatoriamente una sesión de caja abierta.',
                ]);
            }

            $session = null;
            if ($cashSessionId) {
                $session = CashSession::query()
                    ->where('company_id', $companyId)
                    ->where('status', 'open')
                    ->lockForUpdate()
                    ->find($cashSessionId);

                if (! $session) {
                    throw ValidationException::withMessages([
                        'cash_session_id' => 'La sesión de caja no existe, no está abierta o pertenece a otra empresa.',
                    ]);
                }
            }

            $direction = $account instanceof AccountReceivable ? 'in' : 'out';
            $payment = Payment::create([
                'company_id' => $companyId,
                'user_id' => $userId,
                'direction' => $direction,
                'paid_at' => $data['paid_at'] ?? now()->toDateString(),
                'amount' => $amount,
                'method' => $method,
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'payable_type' => $account::class,
                'payable_id' => $account->id,
                'cash_session_id' => $cashSessionId,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            if ($session) {
                $movement = CashMovement::create([
                    'company_id' => $companyId,
                    'cash_session_id' => $session->id,
                    'user_id' => $userId,
                    'type' => $direction === 'in' ? 'in' : 'out',
                    'amount' => $direction === 'in' ? $amount : -$amount,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'notes' => $payment->notes,
                    'source_type' => $payment::class,
                    'source_id' => $payment->id,
                    'idempotency_key' => 'payment:'.$payment->id,
                ]);
                $payment->update(['cash_movement_id' => $movement->id]);
                $this->refreshCashExpected($session);
            }

            $paid = (float) $account->payments()->sum('amount');
            $balance = round((float) $account->original_amount - $paid, 2);
            $account->update([
                'paid_amount' => $paid,
                'balance' => $balance,
                'status' => $balance <= 0 ? 'paid' : 'partial',
            ]);

            if ($account instanceof AccountReceivable) {
                $account->invoice()->update(['status' => $balance <= 0 ? 'paid' : 'partially_paid']);
            }

            return $payment->load('payable', 'cashMovement');
        });
    }

    private function resolveAccount(string $type, int $id, int $companyId): Model
    {
        return match ($type) {
            'receivable' => AccountReceivable::query()->where('company_id', $companyId)->lockForUpdate()->findOrFail($id),
            'payable' => AccountPayable::query()->where('company_id', $companyId)->lockForUpdate()->findOrFail($id),
            default => throw ValidationException::withMessages(['target_type' => 'Tipo de documento invalido.']),
        };
    }

    private function refreshCashExpected(CashSession $session): void
    {
        $movementTotal = (float) $session->movements()->sum('amount');
        $session->update(['expected_amount' => round((float) $session->opening_amount + $movementTotal, 2)]);
    }
}
