<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BranchService
{
    /**
     * Crear una nueva sucursal / sede para una empresa
     *
     * @param  array<string, mixed>  $data
     */
    public function createBranch(array $data, int $companyId): Branch
    {
        return DB::transaction(function () use ($data, $companyId) {
            $isMain = ! empty($data['is_main']);

            if ($isMain) {
                Branch::query()
                    ->where('company_id', $companyId)
                    ->update(['is_main' => false]);
            }

            // Si es la primera sede de la empresa, forzar is_main = true
            $existingCount = Branch::query()->where('company_id', $companyId)->count();
            if ($existingCount === 0) {
                $isMain = true;
            }

            $code = strtoupper(trim((string) ($data['code'] ?? 'SED-'.str_pad((string) ($existingCount + 1), 2, '0', STR_PAD_LEFT))));

            $branch = Branch::create([
                'company_id' => $companyId,
                'code' => $code,
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'is_main' => $isMain,
                'status' => $data['status'] ?? 'active',
            ]);

            return $branch;
        });
    }

    /**
     * Asignar usuario a una o varias sedes
     */
    public function assignUserToBranches(User $user, array $branchIds, ?int $primaryBranchId = null): User
    {
        return DB::transaction(function () use ($user, $branchIds, $primaryBranchId) {
            // Validar que las sedes pertenezcan a la misma empresa del usuario
            $validBranches = Branch::query()
                ->where('company_id', $user->company_id)
                ->whereIn('id', $branchIds)
                ->pluck('id')
                ->all();

            $user->branches()->sync($validBranches);

            if ($primaryBranchId && in_array($primaryBranchId, $validBranches, true)) {
                $user->update(['branch_id' => $primaryBranchId]);
            } elseif (! empty($validBranches) && ! $user->branch_id) {
                $user->update(['branch_id' => $validBranches[0]]);
            }

            return $user->fresh(['primaryBranch', 'branches']);
        });
    }

    /**
     * Resolver la sede activa del contexto del request
     */
    public function resolveActiveBranch(Request $request, int $companyId): ?Branch
    {
        $branchId = $request->header('X-Branch-ID')
            ?? $request->input('branch_id')
            ?? $request->user()?->branch_id;

        if (! $branchId) {
            // Retorna la sede principal de la empresa si existe
            return Branch::query()
                ->where('company_id', $companyId)
                ->where('is_main', true)
                ->first();
        }

        $branch = Branch::query()
            ->where('company_id', $companyId)
            ->whereKey((int) $branchId)
            ->first();

        if (! $branch) {
            throw ValidationException::withMessages([
                'branch_id' => 'La sede seleccionada no pertenece a su empresa o es inválida.',
            ]);
        }

        return $branch;
    }

    /**
     * Obtener lista de sedes permitidas para un usuario
     *
     * @return Collection<int, Branch>
     */
    public function getBranchesForUser(User $user): Collection
    {
        if ($user->hasRole(['admin', 'administrador', 'super-admin'])) {
            return Branch::query()
                ->where('company_id', $user->company_id)
                ->where('status', 'active')
                ->get();
        }

        $assigned = $user->branches()->where('status', 'active')->get();

        if ($assigned->isEmpty() && $user->branch_id) {
            return Branch::query()->whereKey($user->branch_id)->get();
        }

        return $assigned;
    }
}
