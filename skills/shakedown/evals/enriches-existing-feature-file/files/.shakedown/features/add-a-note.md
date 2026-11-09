# Add a note to a ticket

Agents add notes to a ticket while resolving it, to pass on callback numbers, the customer's preferred contact time and who to escalate to.

Pages: Ticket, Notes panel (/tickets/{id})
Via: resources/js/Components/NotesPanel.tsx, app/Http/Requests/StoreNoteRequest.php, app/Http/Controllers/NoteController.php
Tables: notes, note_attachments
Expected from: test_plans/Notes/notes_crud.md
Updated: 2026-08-14, run p2d7

## Success

### S1. Add a note with a subject and a body
Op: create
Setup: A ticket that is ready to resolve, signed in as Agent
Steps:
1. Open the ticket
2. Type "<marker> Callback number" in Subject
3. Type "Call after 3pm" in Body
4. Click Add note
5. Reload the page
Expected: The note is listed with its subject and body after the reload
Database: 1 notes row with the title and body as typed
```sql
select title, body from notes where title like '<marker>%'
```

### S2. Edit a note's subject
Op: update
Setup: S1's note
Steps:
1. Click Edit on S1's note
2. Replace the Subject with "<marker S1> Callback number 555-0142"
3. Click Save
4. Reload the page
Expected: The note shows the new subject after the reload
Database: S1's notes row has the new title, and no second row
```sql
select title from notes where title like '<marker S1>%'
```

## Unexpected use

### U1. Add a note with no subject
Category: missing input
Setup: S1's ticket
Steps:
1. Type "<marker> no subject" in Body
2. Click Add note
Expected: An error under Subject, and nothing stored
Database: no notes row
```sql
select id from notes where body like '<marker>%'
```
Risk: StoreNoteRequest requires title

### U3. Attach a .gif
Category: questionable input
Setup: S1's ticket
Steps:
1. Type "<marker> gif" in Subject
2. Click Attachments
3. In the file picker, select logo.gif
4. Click Open
5. Click Add note
Expected: An error under Attachments, and nothing stored
Database: no notes row
```sql
select id from notes where title like '<marker>%'
```
Risk: StoreNoteRequest allows only pdf, jpg and png

### U4. Add a note to a closed ticket
Category: wrong state
Setup: A closed ticket, signed in as Agent
Steps:
1. Open the closed ticket
2. Type "<marker> late note" in Subject
3. Click Add note
Expected: The note is added, and listed on the closed ticket
Decision: Notes stay open after a ticket is closed, because customers often reply after the fact. Decided by Jordan Reyes, 2026-08-14, run p2d7

## Retired

- U2. Body over 2,000 characters: the body limit was removed when the column became TEXT (2026-09-01)
- U5. Attach more than 3 files: the limit of 3 was removed (2026-09-01)
