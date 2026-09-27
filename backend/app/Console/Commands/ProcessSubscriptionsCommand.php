<?php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use Illuminate\Console\Command;

class ProcessSubscriptionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:process {--company= : ID de la empresa a procesar (opcional)} {--date= : Fecha de corte YYYY-MM-DD (opcional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Procesa las suscripciones activas pendientes de facturación recurrente';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionService $service): int
    {
        $companyId = $this->option('company') ? (int) $this->option('company') : null;
        $date = $this->option('date') ?: null;

        $this->info('Iniciando procesamiento de suscripciones...');

        $processed = $service->processDueSubscriptions($companyId, $date);

        $this->info('Procesamiento completado. Total de suscripciones facturadas: ' . count($processed));

        foreach ($processed as $item) {
            $this->line(" - Suscripción {$item['subscription_number']} -> Factura {$item['invoice_number']} (\$ {$item['amount']})");
        }

        return Command::SUCCESS;
    }
}
