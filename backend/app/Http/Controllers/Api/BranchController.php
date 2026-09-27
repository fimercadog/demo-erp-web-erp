<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\BranchResource;
use App\Models\Branch;
use App\Models\User;
use App\Services\AuditService;
use App\Services\BranchService;
use App\Services\TableQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchController extends BaseCrudController
{
    protected string $model = Branch::class;

    protected string $resource = BranchResource::class;

    protected array $searchable = ['code', 'name', 'address', 'phone', 'email'];

    protected array $filterable = ['status' => 'status', 'is_main' => 'is_main'];

    public function index(Request $request, TableQueryService $tables)
    {
        $companyId = $this->companyId($request);
        $query = Branch::query()->where('company_id', $companyId);

        $tables->apply($request, $query, $this->searchable, $this->filterable);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->orderBy('is_main', 'desc')->orderBy('name', 'asc')->paginate($perPage);

        return BranchResource::collection($records);
    }

    public function store(Request $request, AuditService $audit)
    {
        $service = app(BranchService::class);
        $companyId = $this->companyId($request);

        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_main' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $branch = $service->createBranch($data, $companyId);
        $audit->record('branch.created', $branch, $request);

        return (new BranchResource($branch))->response()->setStatusCode(201);
    }

    public function assignUser(Request $request, string $id, BranchService $service): JsonResponse
    {
        $companyId = $this->companyId($request);
        $branch = Branch::query()->where('company_id', $companyId)->findOrFail($id);

        $data = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')->where('company_id', $companyId)],
            'set_primary' => ['nullable', 'boolean'],
        ]);

        $targetUser = User::query()->where('company_id', $companyId)->findOrFail($data['user_id']);
        $service->assignUserToBranches($targetUser, [$branch->id], ! empty($data['set_primary']) ? $branch->id : null);

        return response()->json(['message' => 'Usuario asignado a la sede correctamente.']);
    }
}
