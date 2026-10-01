<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ObservabilityService
{
    protected LogSanitizer $sanitizer;

    public function __construct(?LogSanitizer $sanitizer = null)
    {
        $this->sanitizer = $sanitizer ?? new LogSanitizer;
    }

    /**
     * Construye un contexto técnico unificado a partir de la solicitud HTTP.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    public function buildContext(Request $request, ?string $module = null, array $extra = []): array
    {
        $headerName = config('observability.request_header', 'X-Request-ID');
        $user = $request->user();
        $staffUser = $user instanceof User ? $user : null;

        $baseContext = [
            'request_id' => $request->header($headerName) ?: (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $staffUser?->id,
            'company_id' => $staffUser?->company_id,
            'module' => $module ?: config('observability.vertical_extensions.module_name', 'core_erp'),
            'path' => $request->path(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        return array_merge($baseContext, $this->sanitizer->sanitize($extra));
    }

    /**
     * Sanitiza un arreglo de datos utilizando las reglas globales y de vertical.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function sanitize(array $data): array
    {
        return $this->sanitizer->sanitize($data);
    }

    /**
     * Registra un evento técnico de seguridad (ej. login fallido, 403, 429).
     *
     * @param  array<string, mixed>  $extraContext
     */
    public function logSecurityEvent(string $event, Request $request, array $extraContext = []): void
    {
        $eventsConfig = config('observability.events', []);

        if (isset($eventsConfig[$event]) && ! $eventsConfig[$event]) {
            return;
        }

        $context = $this->buildContext($request, null, $extraContext);

        switch ($event) {
            case 'login_failed':
                Log::warning('Fallo de inicio de sesión', $context);
                break;
            case 'forbidden':
            case '403_forbidden':
                Log::warning('Acceso denegado (403)', $context);
                break;
            case 'rate_limit':
            case '429_throttle':
                Log::warning('Demasiadas solicitudes (429)', $context);
                break;
            default:
                Log::notice('Evento de seguridad registrado: '.$event, $context);
                break;
        }
    }

    /**
     * Registra una excepción 5xx o no controlada en los logs técnicos desensibilizados.
     */
    public function logUnhandledError(Throwable $e, Request $request): void
    {
        $eventsConfig = config('observability.events', []);

        if (isset($eventsConfig['server_error']) && ! $eventsConfig['server_error']) {
            return;
        }

        $context = $this->buildContext($request, null, [
            'exception_class' => get_class($e),
            'exception_message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace_summary' => collect($e->getTrace())->take(5)->map(fn ($frame) => [
                'file' => $frame['file'] ?? 'unknown',
                'line' => $frame['line'] ?? 0,
                'function' => ($frame['class'] ?? '').($frame['type'] ?? '').($frame['function'] ?? ''),
            ])->all(),
        ]);

        Log::error('Error interno no controlado (500)', $context);
    }

}
