<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompany;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\AuditService;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    use ResolvesCompany;

    public function show(Request $request)
    {
        return response()->json(['data' => $this->company($request)]);
    }

    public function publicInfo(Request $request)
    {
        $companyId = $this->companyId($request);
        $company = Company::findOrFail($companyId);

        return response()->json([
            'data' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'nit' => $company->nit,
                'email' => $company->email,
                'phone' => $company->phone,
                'address' => $company->address,
                'city' => $company->city,
                'logo' => $company->logo,
                'timezone' => $company->timezone,
                'locale' => $company->locale ?? 'es-CO',
                'currency' => $company->currency ?? 'COP',
                'vertical' => $company->vertical ?? 'ips',
            ],
        ]);
    }

    public function update(Request $request, AuditService $audit)
    {
        $company = $this->company($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'locale' => ['nullable', 'string', 'max:10'],
            'currency' => ['nullable', 'string', 'max:10'],
            'date_format' => ['nullable', 'string', 'max:20'],
            'work_start_time' => ['nullable', 'string', 'max:10'],
            'late_grace_minutes' => ['nullable', 'integer', 'min:0'],
            'vertical' => ['nullable', 'string', 'max:50'],
        ]);

        $old = $company->getOriginal();
        $company->update($data);
        $audit->record('updated', $company, $request, $old);

        return response()->json(['data' => $company->fresh()]);
    }

    private function company(Request $request): Company
    {
        return Company::findOrFail($this->companyId($request));
    }
}
