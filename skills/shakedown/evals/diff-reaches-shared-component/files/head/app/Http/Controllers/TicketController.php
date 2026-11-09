<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseTicketRequest;
use App\Models\CloseReason;
use App\Models\Ticket;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index()
    {
        return Inertia::render('Tickets/Index', ['tickets' => Ticket::latest()->paginate()]);
    }

    public function show(Ticket $ticket)
    {
        return Inertia::render('Tickets/Show', ['ticket' => $ticket, 'reasons' => CloseReason::all()]);
    }

    public function close(CloseTicketRequest $form, Ticket $ticket)
    {
        $ticket->update([
            'status' => 'closed',
            'close_reason_id' => $form->validated('close_reason_id'),
            'closed_note' => $form->validated('note'),
            'closed_at' => now(),
        ]);

        return back();
    }
}
