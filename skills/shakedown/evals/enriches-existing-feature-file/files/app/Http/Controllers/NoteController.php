<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoteRequest;
use App\Models\Note;
use App\Models\Ticket;

class NoteController extends Controller
{
    public function store(StoreNoteRequest $request, Ticket $ticket)
    {
        $note = $ticket->notes()->create($request->safe()->only('title', 'body'));
        foreach ($request->file('attachments', []) as $file) {
            $note->attachments()->create(['path' => $file->store('notes'), 'name' => $file->getClientOriginalName()]);
        }

        return back();
    }

    public function update(StoreNoteRequest $request, Note $note)
    {
        $note->update($request->safe()->only('title', 'body'));
        foreach ($request->file('attachments', []) as $file) {
            $note->attachments()->create(['path' => $file->store('notes'), 'name' => $file->getClientOriginalName()]);
        }

        return back();
    }

    public function destroy(Note $note)
    {
        $this->authorize('notes.delete');
        $note->delete();

        return back();
    }
}
