<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->default(1);
            $table->string('phone_number');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->string('state')->default('greeting');
            $table->json('state_data')->nullable();
            $table->boolean('privacy_accepted')->default(false);
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamps();

            $table->unique(['company_id', 'phone_number']);
        });

        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->default(1);
            $table->string('wamid')->unique();
            $table->string('phone_number');
            $table->enum('direction', ['inbound', 'outbound'])->default('inbound');
            $table->string('type')->default('text');
            $table->text('content')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
    }
};
