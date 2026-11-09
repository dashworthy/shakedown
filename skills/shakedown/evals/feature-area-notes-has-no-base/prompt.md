---
tags: [shakedown, planning]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/shakedown:shakedown notes http://localhost

No PR or branch for this one, I just want the ticket notes feature shaken down as it is today. This machine has no tldraw or Chrome, so only do the planning: skip drawing the board, write shakedown.json to ./shakedown/shakedown.json, and stop at the approval stop with the scenario list. Treat the feature list as confirmed when you get there. I'm signed in as Agent, writes are fine, and the database is MySQL, read with `mysql app`. There's no second user, so nothing can be tested without a permission.

Input files: app/Http/Controllers/NoteController.php, app/Http/Requests/StoreNoteRequest.php, app/Models/Note.php, database/migrations/2026_09_01_000000_create_notes_tables.php, resources/js/Components/NotesPanel.tsx, routes/web.php, test_plans/Notes/notes_crud.md
