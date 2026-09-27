<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Http\Request;

class PublicTenantResolverService
{
    public function resolveCompany(Request $request): Company
    {
        // 1. Authenticated user's company
        if ($userCompany = $request->user()?->company) {
            return $userCompany;
        }

        // 2. Explicit header or query parameter (NOT untrusted body payload)
        $slug = $request->header('X-Company-Slug') ?? $request->query('company_slug');
        if ($slug) {
            $company = Company::where('slug', $slug)->first();
            if ($company) {
                return $company;
            }
        }

        $companyId = $request->header('X-Tenant-ID') ?? $request->query('company_id');
        if ($companyId && is_numeric($companyId)) {
            $company = Company::find((int) $companyId);
            if ($company) {
                return $company;
            }
        }

        // 3. Subdomain resolution
        $host = $request->getHost();
        $parts = explode('.', $host);
        if (count($parts) > 2 && ! in_array($parts[0], ['www', 'localhost', '127'], true)) {
            $subdomain = $parts[0];
            $company = Company::where('slug', $subdomain)->first();
            if ($company) {
                return $company;
            }
        }

        // 4. Default company (first company created in DB)
        /** @var Company|null $first */
        $first = Company::orderBy('id')->first();
        if ($first) {
            return $first;
        }

        abort(500, 'El sistema no tiene ninguna empresa configurada.');
    }

    public function resolveCompanyId(Request $request): int
    {
        return $this->resolveCompany($request)->id;
    }
}
