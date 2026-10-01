<?php

namespace App\Services\WhatsApp\Contracts;

use App\Models\WhatsAppConversation;

interface IntentResolverInterface
{
    /**
     * Resolves intent and extracts entities from incoming user message text.
     *
     * @return array{
     *   intent: string,
     *   confidence: float,
     *   entities: array<string, mixed>
     * }
     */
    public function resolve(string $text, WhatsAppConversation $conversation): array;
}
