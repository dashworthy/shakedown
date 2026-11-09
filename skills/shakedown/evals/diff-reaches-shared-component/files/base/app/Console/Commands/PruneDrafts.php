<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use Illuminate\Console\Command;

class PruneDrafts extends Command
{
    protected $signature = 'tickets:prune-drafts';

    public function handle(): void
    {
        Ticket::where('status', 'draft')->where('created_at', '<', now()->subDays(30))->delete();
    }
}
