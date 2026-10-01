<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\User;
use App\Services\LogSanitizer;
use App\Services\ObservabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class TechnicalLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_and_returns_x_request_id_header(): void
    {
        $response = $this->getJson('/api/public/company');

        $response->assertHeader('X-Request-ID');
        $requestId = $response->headers->get('X-Request-ID');

        $this->assertNotEmpty($requestId);
        $this->assertMatchesRegularExpression('/^[a-zA-Z0-9\-_]{8,64}$/', $requestId);
    }

    public function test_reuses_existing_valid_x_request_id_from_client(): void
    {
        $customRequestId = 'client-req-id-1234567890';

        $response = $this->withHeaders([
            'X-Request-ID' => $customRequestId,
        ])->getJson('/api/public/company');

        $response->assertHeader('X-Request-ID', $customRequestId);
    }

    public function test_replaces_invalid_x_request_id_with_new_uuid(): void
    {
        $invalidRequestId = 'short'; // < 8 caracteres

        $response = $this->withHeaders([
            'X-Request-ID' => $invalidRequestId,
        ])->getJson('/api/public/company');

        $response->assertHeader('X-Request-ID');
        $newRequestId = $response->headers->get('X-Request-ID');

        $this->assertNotEquals($invalidRequestId, $newRequestId);
        $this->assertMatchesRegularExpression('/^[a-zA-Z0-9\-_]{8,64}$/', $newRequestId);
    }

    public function test_logs_failed_login_with_masked_email_and_no_passwords(): void
    {
        Log::spy();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'usuario@example.com',
            'password' => 'wrong-password-123',
        ]);

        $response->assertStatus(422);

        Log::shouldHaveReceived('warning')
            ->once()
            ->with('Fallo de inicio de sesión', \Mockery::on(function ($context) {
                return isset($context['request_id'])
                    && $context['email_masked'] === (new LogSanitizer)->maskEmail('usuario@example.com')
                    && ! str_contains(json_encode($context), 'wrong-password-123');
            }));
    }

    public function test_logs_403_forbidden_event_with_request_id(): void
    {
        Log::spy();

        $response = $this->getJson('/api/test-403');

        $response->assertStatus(403);

        Log::shouldHaveReceived('warning')
            ->once()
            ->with('Acceso denegado (403)', \Mockery::on(function ($context) {
                return isset($context['request_id']) && $context['path'] === 'api/test-403';
            }));
    }

    public function test_logs_500_internal_error_with_request_id_and_sanitized_trace(): void
    {
        Log::spy();

        $response = $this->getJson('/api/test-500');

        $response->assertStatus(500);

        Log::shouldHaveReceived('error')
            ->once()
            ->with('Error interno no controlado (500)', \Mockery::on(function ($context) {
                return isset($context['request_id'])
                    && $context['exception_class'] === 'RuntimeException'
                    && $context['exception_message'] === 'Error simulado en backend'
                    && isset($context['trace_summary']);
            }));
    }

    public function test_log_sanitizer_recursively_redacts_nested_sensitive_keys(): void
    {
        $sanitizer = new LogSanitizer;

        $rawInput = [
            'user' => [
                'name' => 'Usuario Test',
                'password' => 'secret123',
                'credentials' => [
                    'auth_token' => 'bearer-xyz',
                    'credit_card' => '4111-2222-3333-4444',
                ],
            ],
            'public_info' => 'OK',
        ];

        $sanitized = $sanitizer->sanitize($rawInput);

        $this->assertEquals('Usuario Test', $sanitized['user']['name']);
        $this->assertEquals('[REDACTED]', $sanitized['user']['password']);
        $this->assertEquals('[REDACTED]', $sanitized['user']['credentials']['auth_token']);
        $this->assertEquals('[REDACTED]', $sanitized['user']['credentials']['credit_card']);
        $this->assertEquals('OK', $sanitized['public_info']);
    }

    public function test_business_audit_log_continues_functioning(): void
    {
        $company = Company::firstOrCreate(['name' => 'Empresa ERP Audit'], ['nit' => '900.123.456-8']);
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Audit User',
            'email' => 'audit@example.com',
            'password' => '$2y$12$abcdefg',
        ]);

        $auditLog = AuditLog::create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'action' => 'update',
            'module' => 'company',
            'entity' => Company::class,
            'entity_id' => $company->id,
            'old_values' => ['name' => 'Old Name'],
            'new_values' => ['name' => 'New Name'],
            'ip_address' => '127.0.0.1',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'id' => $auditLog->id,
            'action' => 'update',
            'module' => 'company',
        ]);
    }

    public function test_vertical_config_extensions_are_merged_into_observability_config(): void
    {
        $config = config('observability');

        $this->assertArrayHasKey('version', $config);
        $this->assertEquals('1.0.1', $config['version']);
        $this->assertArrayHasKey('vertical_extensions', $config);
    }

    public function test_core_observability_module_has_zero_vertical_coupling(): void
    {
        $filesToCheck = [
            base_path('config/observability.php'),
            base_path('app/Services/ObservabilityService.php'),
            base_path('app/Services/LogSanitizer.php'),
            base_path('app/Http/Middleware/RequestIdMiddleware.php'),
            base_path('docs/observability-module.md'),
        ];

        $prohibitedTerms = ['veterinaria', 'estetica', 'clinica-estetica', 'ips', 'rrhh', 'inmobiliaria', 'mascota', 'veterinarian'];

        foreach ($filesToCheck as $filePath) {
            $this->assertFileExists($filePath);
            $content = strtolower((string) file_get_contents($filePath));

            foreach ($prohibitedTerms as $term) {
                $this->assertFalse(
                    str_contains($content, $term),
                    "El archivo [{$filePath}] contiene el término prohibido de vertical [{$term}]."
                );
            }
        }
    }
}
