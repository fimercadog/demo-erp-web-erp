<?php

namespace App\Http\Controllers\Api;

use App\Models\PurchaseOrder;
use App\Services\ThreeWayMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThreeWayMatchingController extends BaseCrudController
{
    protected string $model = PurchaseOrder::class;

    public function matchAnalysis(Request $request, string $id, ThreeWayMatchingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $po = PurchaseOrder::where('company_id', $companyId)->findOrFail($id);

        $matchAnalysis = $service->evaluateMatch($po->id);

        return response()->json(['data' => $matchAnalysis]);
    }

    public function evaluate(Request $request, string $id, ThreeWayMatchingService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $po = PurchaseOrder::where('company_id', $companyId)->findOrFail($id);

        $matchAnalysis = $service->evaluateMatch($po->id);

        return response()->json([
            'message' => 'Evaluación de Matching 3 Vías completada.',
            'data' => $matchAnalysis,
        ]);
    }
}
