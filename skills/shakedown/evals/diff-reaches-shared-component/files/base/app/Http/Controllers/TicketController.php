<?php

namespace App\Http\Controllers;

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
        return Inertia::render('Tickets/Show', ['ticket' => $ticket]);
    }
}
