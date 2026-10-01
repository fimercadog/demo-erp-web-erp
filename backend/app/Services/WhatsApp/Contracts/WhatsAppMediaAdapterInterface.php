<?php

namespace App\Services\WhatsApp\Contracts;

interface WhatsAppMediaAdapterInterface
{
    /**
     * Transcribes audio media (e.g. Whisper integration or fallback) into text.
     */
    public function transcribeAudio(string $mediaId): string;
}
