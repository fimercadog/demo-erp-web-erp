<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Services\PublicTenantResolverService;
use Illuminate\Http\Request;

/**
 * Resuelve la empresa (tenant) del request de forma dinámica.
 */
trait ResolvesCompany
{
    protected function companyId(Request $request): int
    {
        return app(PublicTenantResolverService::class)->resolveCompanyId($request);
    }
}
