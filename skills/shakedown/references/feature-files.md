# Feature files

A feature file keeps a feature's approved scenarios in the repo, at `.shakedown/features/<feature-slug>.md`, so the next shakedown that reaches the feature starts from them instead of from scratch, and the list grows with every run. It holds the plan, never results: what to do and what should happen, not what happened on one run.

It is also how the team keeps what it knows about a feature when the people who built it move on. Someone new, without this skill, should be able to read a file and learn what the feature is for, how to check it by hand, and why it behaves as it does, including every "what should happen here?" that someone once had to decide. So write each file for that reader: plain sentences, the app's own words, no shakedown jargon beyond what `.shakedown/README.md` explains.

Contents: format, ids and markers, decisions, starting from a file, writing files.

## Format

```markdown
# Add a note to a ticket

Agents add notes to a ticket while resolving it, to pass on what the next person needs: callback numbers, the customer's preferred contact time, who to escalate to. A note has a required title, an optional body and any number of PDF, JPG or PNG attachments of 5 MB each. Deleting a note hides it but keeps its attachments.

Pages: Ticket, Notes tab (/tickets/{id}?tab=notes)
Via: resources/js/Components/NotesPanel.tsx, app/Http/Requests/StoreNoteRequest.php, app/Http/Controllers/NoteController.php
Tables: notes, note_attachments
Expected from: test_plans/Notes/notes_crud.md
Updated: 2026-11-09, run k3x9, PR 142

## Success

### S1. Add a note with a title, a body and one attachment
Op: create
Setup: A ticket that is ready to resolve, signed in as Agent
Steps:
1. Open the ticket
2. Click the Notes tab
3. Type "<marker> Callback number" in Title
4. Type "Call after 3pm" in Body
5. Click Attachments
6. In the file picker, select callback.pdf
7. Click Open
8. Click Add note
9. Reload the page
Expected: The note is listed with its title, body and callback.pdf after the reload
Database: 1 notes row with the title and body as typed, 1 note_attachments row named callback.pdf under it
```sql
select n.title, n.body, a.name from notes n left join note_attachments a on a.note_id = n.id where n.title like '<marker>%'
```

## Unexpected use

### U1. Add a note with no title
Category: missing input
Setup: S1's ticket
Steps:
1. Type "<marker> no title" in Body
2. Click Add note
Expected: "The title field is required." under Title, and nothing stored
Database: no notes row, with S1's query finding S1's note
Risk: StoreNoteRequest.php:17 requires title; the panel shows its error

### U2. Add a note to a closed ticket
Category: wrong state
Setup: A closed ticket, signed in as Agent
Steps:
1. Open the closed ticket
2. Click the Notes tab
3. Type "<marker> late note" in Title
4. Click Add note
Expected: The note is added, and listed on the closed ticket
Decision: Notes stay open after a ticket is closed, because customers often reply after the fact. Decided by Jordan Reyes, 2026-11-09, run k3x9 (nothing written down said)

## Found in testing

### X1. A second attachment's error never shows
...

## Retired

- U4. Attach a .gif: gifs became allowed in PR 160, so this is S6 now (2026-12-03)
```

- The paragraph under the title says what the feature is for and who uses it, and the rules a newcomer would trip over, in plain words. Write it from the code, specs and decisions; update it when they change.
- One `###` per scenario, under the heading for its `type`: Success, Unexpected use, Found in testing. A section with no scenarios is left out.
- The lines under each are the scenario's fields from shakedown.json, by name: `Op`, `Category`, `Setup`, `Steps`, `Expected`, `Database` (its `db.expect`, then its `db.query` in a `sql` block), `Risk`, `Decision`.
- A question left open at Stop 2 is written as `Expected: Not decided yet` with a `Question:` line under it, so the next reader sees what nobody has settled, and the next run asks again. Leave out a field the scenario doesn't have.
- `Retired` lists scenarios that no longer apply, each with why and the date, so their ids are never reused.

## Ids and markers

The file's ids are the feature's own: `S1`, `U1`, `X1`, with no feature number, because the feature is F1 in one run and F3 in the next. In a run, a scenario from the file keeps its id behind the run's feature id: `S1` in the file is `F3.S1` when the feature is F3. A new scenario takes the next number after the highest in the file, retired ones included.

Queries and steps in the file write `<marker>` for the scenario's own marker and `<marker S1>` for another scenario's, because the marker holds the run id and the run's feature id. When loading, replace each with the run's marker: `<marker>` in F3.U1 becomes `(shakedown k3x9 F3.U1)`, and `<marker S1>` becomes `(shakedown k3x9 F3.S1)`. When writing, put the placeholders back.

## Decisions

An open question answered at Stop 2 is a decision about how the app should behave, and it's the knowledge most easily lost: the code shows what the app does, not that someone chose it. Write it on the scenario as `Decision:` with the answer's reason, who answered (the git user, `git config user.name`), the date and the run, and where it came from when it wasn't the user (a spec, a ticket, a convention elsewhere in the app). Keep decisions when a scenario changes, and when a later run gets a different answer, replace the line and keep the old one after it as `Was:`, so the history of the rule stays readable.

## Starting from a file

In Phase 1, look in `.shakedown/features/` for each feature found. A file matches a feature when it describes the same thing a user does, which its title, pages and `Via` show: the slug alone isn't enough, because features get renamed. Record the match in the feature's `file`. A file that two features match, or a feature that matches two files (a feature that was split or merged), is a question for Stop 1.

In Phases 2 and 3, a feature with a file starts from its scenarios, not from scratch. Check each one against the code and specs as they are now, and set its `origin`:

- `file`: still applies as written.
- `changed`: still applies, but something it depends on moved: a control's label, a page's URL, a validation rule, the spec's expectation. Update it and say what changed in `change`. Where the spec now says something different from its `expected`, it's an open question instead of a guess.
- Retired: the behavior it tests is gone. Don't drop it: add it to the feature's `retire` with why, so the user approves the removal at Stop 2.

Then go through success.md and unexpected.md as usual and add what the file doesn't cover yet, with `origin: new`: the change's new behavior, and anything the guides list that no earlier run wrote down. A `reached` feature still gets only the smoke, but take it from the file's success scenarios that exercise the changed shared code, when it has some.

At Stop 2, the table gains a column per feature: from file, changed, new, to retire.

## Writing files

After Stop 2's approval, write one file per feature in this run: create it for a feature without one, otherwise update it. Keep everything this run didn't test or change, in its place. Apply the approved changes and retirements, add the new scenarios in id order, set `Updated`, and leave out run-only fields (`status`, `actual`, `shots`, `image`, `verdict`, `test`). Every answer to an open question is now the scenario's `expected`.

At Report, add each `found` scenario to its feature's file under Found in testing, so the next run checks that the bug is fixed and stays fixed.

The first time, also write `.shakedown/README.md` from the template below, so the folder explains itself to someone who has never heard of this skill.

Leave the files uncommitted, like the failing tests, and say in the report which were created and which updated: the user commits them with the change, so the plan is reviewed and versioned like the code it describes.

## README template

```markdown
# Feature scenarios

Each file in `features/` describes one feature of this app the way a user sees it: what it's for, every scenario that proves it works, every way a user could make it misbehave, and the decisions about what should happen where nothing else says. They were written and kept up to date by shakedown runs (a Claude Code plugin), and reviewed in pull requests like the code.

Use them to learn a feature, to test it by hand before a release, or to answer "is this a bug or a decision?".

- **S** scenarios prove the feature works. **U** scenarios are misuse it should handle. **X** scenarios are bugs found in testing, kept so they stay fixed.
- `Setup:` is what has to exist before the steps, often another scenario's record ("S1's note"): do that scenario first.
- `Op:` says whether the scenario creates, updates or deletes a record. `Category:` says what kind of misuse a U scenario is.
- `Decision:` lines record who decided how the app should behave, when and why. `Expected: Not decided yet` with a `Question:` is one nobody has settled: ask the product owner, and write the answer in as a decision.
- `Risk:` says why the scenario might fail, pointing at the code (`StoreNoteRequest.php:17` is that file, line 17).
- `<marker>` in steps and queries is a tag that marks test data, so it can be found and cleaned up. Testing by hand, type any unique text in its place, like your initials and the date. `<marker S1>` means the tag you used in S1, because the scenario works on S1's record.
- `Database:` says what should be stored, and the `sql` block below it reads it back.
- Some scenarios need a second user, without a permission: they're marked in their `Setup:`.
- `Retired` lists scenarios that no longer apply, and why.
```
