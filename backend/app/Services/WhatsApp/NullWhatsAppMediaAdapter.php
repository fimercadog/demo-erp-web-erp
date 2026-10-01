<?php

namespace App\Services\WhatsApp;

use App\Services\WhatsApp\Contracts\WhatsAppMediaAdapterInterface;

class NullWhatsAppMediaAdapter implements WhatsAppMediaAdapterInterface
{
    public function transcribeAudio(string $mediaId): string
    {
        // Fallback placeholder transcription for testing audio webhooks
        return 'Quiero agendar una cita para mi mascota';
    }
}
