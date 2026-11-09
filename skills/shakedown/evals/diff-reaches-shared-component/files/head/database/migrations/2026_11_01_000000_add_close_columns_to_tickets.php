<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('close_reason_id')->nullable()->constrained();
            $table->string('closed_note', 500)->nullable();
            $table->timestamp('closed_at')->nullable();
        });
    }
};
