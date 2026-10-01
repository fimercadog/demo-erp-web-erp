<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppConversation;
use App\Services\WhatsApp\Contracts\IntentResolverInterface;

class DeterministicIntentResolver implements IntentResolverInterface
{
    public function resolve(string $text, WhatsAppConversation $conversation): array
    {
        $normalized = mb_strtolower(trim($text));

        // Privacy acceptance check
        if (! $conversation->privacy_accepted && in_array($normalized, ['acepto', 'sí', 'si', '1', 'aceptar', 'acepto politicas', 'acepto políticas'], true)) {
            return [
                'intent' => 'accept_privacy',
                'confidence' => 1.0,
                'entities' => [],
            ];
        }

        // Human handover request
        if (preg_match('/\b(humano|persona|agente|asesor|operador|hablar con alguien|asistencia humana)\b/u', $normalized)) {
            return [
                'intent' => 'human_handover',
                'confidence' => 0.95,
                'entities' => [],
            ];
        }

        // Greeting
        if (preg_match('/\b(hola|buen[oa]s?\s+(d[ií]as|tardes|noches)|saludos|hey|inicio)\b/u', $normalized)) {
            return [
                'intent' => 'greeting',
                'confidence' => 0.95,
                'entities' => [],
            ];
        }

        // Book appointment request
        if (preg_match('/\b(cita|agendar|reservar|consulta|turno|disponibilidad|pedir cita|necesito cita|ver disponibilidad)\b/u', $normalized)) {
            return [
                'intent' => 'book_appointment',
                'confidence' => 0.90,
                'entities' => [],
            ];
        }

        // Reschedule
        if (preg_match('/\b(reagendar|cambiar cita|mover cita|posponer)\b/u', $normalized)) {
            return [
                'intent' => 'reschedule',
                'confidence' => 0.90,
                'entities' => [],
            ];
        }

        // Cancel
        if (preg_match('/\b(cancelar cita|anular cita|borrar cita)\b/u', $normalized)) {
            return [
                'intent' => 'cancel',
                'confidence' => 0.90,
                'entities' => [],
            ];
        }

        // Numeric choice / selection
        if (preg_match('/^\d+$/', $normalized)) {
            return [
                'intent' => 'select_option',
                'confidence' => 1.0,
                'entities' => [
                    'option_index' => (int) $normalized,
                ],
            ];
        }

        // Date match (e.g. YYYY-MM-DD or hoy / mañana)
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $normalized) || in_array($normalized, ['hoy', 'mañana', 'manana'], true)) {
            return [
                'intent' => 'provide_date',
                'confidence' => 0.95,
                'entities' => [
                    'date_str' => $normalized,
                ],
            ];
        }

        // Time slot match (e.g. 09:00 or 14:30)
        if (preg_match('/^\d{1,2}:\d{2}$/', $normalized)) {
            return [
                'intent' => 'provide_time',
                'confidence' => 0.95,
                'entities' => [
                    'time_str' => sprintf('%05s', $normalized),
                ],
            ];
        }

        // Default / provide text info
        return [
            'intent' => 'provide_info',
            'confidence' => 0.70,
            'entities' => [
                'raw_text' => trim($text),
            ],
        ];
    }
}
