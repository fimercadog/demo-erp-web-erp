<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppMessage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsAppNotificationService
{
    /**
     * Send outbound text message to user phone.
     */
    public function sendTextMessage(int $companyId, string $toPhone, string $text): bool
    {
        // Record outbound message in DB
        $wamid = 'out_'.Str::uuid();
        WhatsAppMessage::create([
            'company_id' => $companyId,
            'wamid' => $wamid,
            'phone_number' => $toPhone,
            'direction' => 'outbound',
            'type' => 'text',
            'content' => $text,
        ]);

        $token = config('services.whatsapp.access_token');
        $phoneId = config('services.whatsapp.phone_number_id');

        if (empty($token) || empty($phoneId) || app()->environment('testing')) {
            Log::info("WhatsApp Outbound Simulated [{$toPhone}]: {$text}");
            return true;
        }

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/v18.0/{$phoneId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $toPhone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $text,
                    ],
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("WhatsApp send error: ".$e->getMessage());
            return false;
        }
    }
}
