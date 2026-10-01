<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsApp\WhatsAppAgentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsAppWebhookController extends Controller
{
    public function __construct(
        private readonly WhatsAppAgentService $agentService
    ) {}

    /**
     * Webhook verification endpoint (Meta Challenge Handshake)
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $token = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));

        $expectedToken = config('services.whatsapp.verify_token', 'vet_secret_webhook_token');

        if ($mode === 'subscribe' && $token === $expectedToken) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Invalid verify token'], 403);
    }

    /**
     * Process incoming WhatsApp events & messages
     */
    public function handle(Request $request)
    {
        $appSecret = config('services.whatsapp.app_secret');
        if (! empty($appSecret) && ! app()->environment('testing')) {
            $signature = $request->header('X-Hub-Signature-256');
            if (! $signature) {
                return response()->json(['error' => 'Missing signature'], 403);
            }

            $expectedSignature = 'sha256='.hash_hmac('sha256', $request->getContent(), $appSecret);
            if (! hash_equals($expectedSignature, $signature)) {
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        $payload = $request->all();
        $this->agentService->processIncomingPayload($payload, $request);

        return response()->json(['status' => 'ok'], 200);
    }
}
