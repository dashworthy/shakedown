---
name: shakedown
description: Shake down a change or a feature area in the running app, in phases on one tldraw doc. Finds every feature in scope, lists every way to prove each one works (create, update and delete included), lists every way a user could make it misbehave (missing, questionable and boundary inputs, odd sequences, wrong states and roles), and compiles them into one scenario list per feature for the user to approve. Then tests every scenario in Chrome, with a screenshot of every step and a read-only database check each, confirms failures on the base branch, leaves a failing browser test per confirmed bug, and posts the board and results as a PR comment. Report-only, never edits app code. Use when asked for a shakedown, manual test, QA pass, test plan, edge-case hunt, browser review, smoke test or click-through of a PR, branch, spec or feature.
disable-model-invocation: true
argument-hint: "[PR, branch, spec or feature] [app URL]"
---

# Shakedown

Code review reads the diff, and the test suite proves what someone thought to test. A shakedown first writes down everything there is to test: every feature in scope, every way to prove each one works, and every way a user could make it misbehave. The user approves that list. Then every scenario on it is run in the app the way a user would, and checked in the database behind the app. It finds and proves. It never edits app code, and changes only data it created or the user pointed it to: the person running it decides what gets fixed.

```
1 Features ─► STOP 1 ─► 2 Success ─► 3 Unexpected use ─► 4 Scenarios ─► STOP 2 ─► Test ─► Base ─► Prove ─► Report
                confirm                                                     approve   (page 4 fills in with results,
                                                                                       page 5 with a screenshot per step)
```

Approved scenarios are kept in the repo as one markdown file per feature, under `.shakedown/features/`, so the next run that reaches a feature starts from what earlier runs learned, and so what the team knows about it outlives the people who built it ([references/feature-files.md](references/feature-files.md)).

Each numbered phase is a page of one tldraw doc, and testing adds a fifth, 5 Walkthroughs: one frame per scenario with a captioned screenshot of every step, so anyone can repeat it by following the pictures. Everything lives in `<scratch>/shakedown/shakedown.json` ([format](#shakedownjson)), and `scripts/board.mjs` draws the pages from it: the file is the record, the board is how the user reads it. `<scratch>` is the session's scratchpad directory if it has one, otherwise a `mktemp -d` directory.

## Before starting

**Target.** One of:

- A PR: its diff against its base.
- A branch: its diff against its PR's base (`gh pr view <branch> --json number,baseRefName`), else the repo's default branch.
- A spec (an OpenSpec change, a ticket, a spec file): what it describes, plus the current branch's diff if the branch implements it.
- A feature area ("orders", "the support inbox"): what is there now.
- Nothing: the current branch.

A feature area, or a spec with no diff, has nothing to compare against, so Base is skipped. With no PR, everything runs except the PR comment; say so in the report.

**Tools.** Check before Phase 1:

- tldraw Desktop is running: `curl -s http://localhost:7236/`. If it fails, ask the user to start it.
- The Claude in Chrome tools are available.
- A way to read the app's database: a command that runs the SQL piped to it and prints the rows, from the project's dev tooling (`./vendor/bin/sail mysql`, `docker compose exec -T db psql -U app app`, `sqlite3 database/database.sqlite`). Prove it with `echo 'select 1 as ok' | <command>`: it must print the `ok` row. A command that ignores its input prints nothing, and every "nothing stored" check would pass. Record it in `app.db`. Never write a password into it: use a wrapper that already has one, or a command that reads it from the env file when it runs. With no way in, the DB checks are written anyway and reported as not checked.

Pick a `run` id: four random lowercase letters and digits, like `k3x9`. It goes in every [marker](#database-checks), so this run's rows never match an earlier run's.

**Ask** the user, in one AskUserQuestion, for whatever the arguments didn't give:

- **Head URL.** Where the change is running, built from its head commit.
- **Base.** How Base reaches the base branch: a second URL and the command that reads its database (the same `app.db` when both share one), or the user switches the app when asked. Record it in `app.base`. Skip when Base is skipped.
- **Login.** The user signs in to Chrome themselves; never type credentials. Ask which role they're signed in as, and whether a user without the feature's permissions is available.
- **Writes.** Whether scenarios may create, edit and delete data there, in a local or review environment, never production. Scenarios change and delete only records they created, unless the user names others here. If writes aren't allowed, scenarios that write are `not-tested` with "writes not allowed".

## 1. Features

A feature is one thing a user can do or see, named the way they would say it: "Add several lines to an order", "Filter tickets by status". Not a file, a class or an endpoint.

Find them from the target:

- **A diff.** Walk up from each changed file to what a user reaches:
  - A page or view maps to its route.
  - A component or hook reaches every page that imports it, directly or through another component.
  - A controller, request validator, serializer, service, query, model or permission reaches its routes, then every page and client call that uses them. Server-defined grids, filters, charts and map layers render on pages whose frontend code never changed.
  - A renamed or removed route reaches every link to it.

  Group what you reach into features. Each is `new`, `changed`, or `reached`: unchanged itself, but running changed shared code.
- **A spec.** Every requirement and scenario in it belongs to at least one feature: `new` where the spec adds it, `changed` where it modifies it, `existing` where it says neither. A diff adds the features the spec didn't name.
- **A feature area.** Its navigation entries, pages, toolbar and row actions, forms, and the permissions that guard them. Each is `existing`.

For each feature, record its pages, the files that reach it (`via`), the tables it writes (from its models, actions and migrations: later phases check these), and where its expected behavior is written down (`expected_from`): specs, the PR description, the ticket, the project's test plans, and its automated tests, which record what someone decided it should do.

Look for each feature's file in `.shakedown/features/` and record it in `file`: [references/feature-files.md](references/feature-files.md) says how to tell which file is whose.

Anything changed that no user can reach (a migration with no visible effect, a console command, a pure refactor) goes in `out_of_scope` with the reason, so the user can tell skipped from missed.

Draw the page: `node <this skill's directory>/scripts/board.mjs <scratch>/shakedown/shakedown.json features`. The first run creates the doc in the user's Documents folder and opens it.

**Stop 1.** Show the features as a table (id, feature, kind, pages, tables, file: its path, or "new") with the count, then the out-of-scope list and the doc's path. Ask the user to confirm the list, or to add, drop, merge or split features, in chat or on the Features page: notes, arrows, comments, or edits to a card's text. Read them all with `board.mjs <json> notes`, which prints each with the card it's on. Apply them to shakedown.json, redraw, say which ones you applied so the user can delete or resolve them, and ask again until it's confirmed. Scope is cheapest to fix here, because every later phase multiplies by the feature count.

A draw stops if the user edited a card's text, so the edit is never lost: read it with `notes`, apply it to shakedown.json, and draw again with `--overwrite-edits`.

## 2. Success

For each feature, every way to prove it works. A feature with a file starts from its scenarios, each checked against the code as it is now: see "Starting from a file" in [references/feature-files.md](references/feature-files.md). Read [references/success.md](references/success.md) first: it lists where scenarios come from, including create, update and delete for every record the feature writes, and the round trip for complex forms.

Each scenario is one distinct successful outcome. Its `expected` is what a user would see that only happens if it worked: the values after a reload, the new row in the list, the count that changed. "No error appeared" proves nothing. Each scenario that writes data also gets a [database check](#database-checks).

A `reached` feature gets the smoke in success.md, not the full list.

## 3. Unexpected use

For each feature, every way a user could make it misbehave, starting from its file's like Success. Read [references/unexpected.md](references/unexpected.md) first. Skip `reached` features, unless the shared change itself makes a misuse likely (a validator they share got looser): then write that one scenario.

Start from the code that guards the feature: validation in the form and on the server, database constraints, what the UI disables or hides, permission checks, and how updates and deletes treat related rows. A rule on one side and not the other, a constraint with nothing in front of it, a check only in the UI, an update that deletes and re-inserts child rows: each is where a scenario is most likely to find something. Say so in its `risk`, with the file and line.

Keep to what a user can do in a browser: type, paste, click, navigate, use several tabs, edit the URL. A gap that only a hand-crafted request can reach goes in the report's notes instead.

Each scenario says what should happen, on screen and in the database (most often: an error next to the field, and nothing stored or changed). Where nothing written down says, and the app has no convention to follow, set `expected` to null and write the `question`. Don't guess: a guessed expectation becomes a pass or a fail nobody agreed to.

## 4. Scenarios

Turn the two lists into the one testing will follow:

- Order each feature's scenarios so they share setup and keep the same page open: creates before the updates and deletes that use what they made.
- Merge duplicates: the same steps with the same expectation.
- Give each scenario its `setup`: the records it needs, in which state, as which user.
- Write its `steps` as instructions someone else could follow: one user action each (open, click, type, select, save, reload), naming the control by its label on screen and the value typed. Each step gets its own screenshot during testing, so a step that hides two actions hides the one that went wrong. Not "Switch to tab 2 and click Close" (two steps), "Repeat for H and I" (which steps?) or "Change Notes" (to what?). Three kinds of step hide inside others most often, so each gets its own:
  - **Switching tabs.** In a multi-tab scenario, "Switch to tab A" is a step before the first action there, every time, not a prefix on the action ("In tab A, click Delete").
  - **Dialogs.** Opening a dialog and answering it are two steps, and the answer names its button: "Click Delete", then "In the confirm dialog, click OK".
  - **Repeats.** Write out each repetition, or say how many: "Press Back twice", not "Press Back until the form shows". Typing a long value is one step: "Type 256 × \"a\" in Notes".
  - **File pickers.** Opening the picker, choosing the files and confirming are separate steps: "Click Attachments", then "In the file picker, select a.pdf and b.png", then "Click Open". Choosing several files at once is one step.

  When a select's options come from the database and you can't read them yet, name the option by position and add the step "Note the option text" after it ("Select the first option in Reason", then "Note the option text"), so testing records the actual value and later steps and checks can use it.
- Set each scenario's `status` to `planned`, or to `not-tested` with the reason in `why` when it can't run here: writes not allowed, no user without the permission, needs a second device.

Draw the pages: `board.mjs <json> success unexpected scenarios`.

**Stop 2.** Show a table with one row per feature: success, unexpected, not tested, and for a feature with a file, how many came from it unchanged, changed and new, and which it proposes to retire and why. Ask each open question with AskUserQuestion, up to four per call, with the plausible behaviors as options and your recommendation first. Read anything the user added on the board with `notes`. Write each answer into `expected` and its reason into `decision`, drop the `question`, apply the notes, and redraw all four pages, so the plan on the board and in the PR is the one approved: `board.mjs <json> features success unexpected scenarios`. Then give the total and a time estimate (about 2 minutes a scenario, 4 for one that writes and checks the database, plus 20 seconds a step for its screenshot), and ask the user to approve. Don't open the app until they do: the approved list is what "tested" means for this run. Once approved, write the feature files ("Writing files" in feature-files.md).

## 5. Test

In Chrome:

- Load the tools in one ToolSearch: tabs_context_mcp, tabs_create_mcp, navigate, computer, read_page, find, form_input, file_upload, get_page_text, read_console_messages, read_network_requests, gif_creator, resize_window. Work in a new tab, never the user's.
- Prove `app.db` reads the head app's database: look up one record the app is showing.

For each scenario, in order:

1. For an update or delete, run its `db` query first and set `db.before`. It must return the record about to change; if it doesn't, fix the query before going on, or the check afterwards proves nothing.
2. Do its steps from a fresh page load. Every record it creates carries its [marker](#database-checks) in a text field (a name, note or reference), so its database check finds exactly those rows and the user can find and clean them up. An edit to that field keeps the marker in it. Change and delete only records a scenario created, or ones the user named.
3. After each step, once the page has settled, screenshot it with `save_to_disk: true` and add `{ "step": <its number>, "image": <the path> }` to the scenario's `shots`. Then read console messages and network requests with `clear: true`, so each error is tied to the step that caused it. A screenshot shows what the step did: the open dialog, the filled field, the saved row. When the step's control is small or off to one side, zoom to it instead. If a step can't be done, screenshot where it stopped, set `note` on that shot to what blocked it, and leave the later steps without shots.
4. Screenshot the moment that shows the result, with `save_to_disk: true`, and set `image`. When the last step's shot already shows it, reuse that path.
5. Run the `db` query and set `db.actual`.
6. Set `status`. It is `pass` only when the screen and the database both match what was expected. For a `fail`, set `actual`, `severity`, `evidence` (the console or network line) and `why`: what it costs the user or breaks, not a restatement of what happened. For a bug that takes several steps to show, also record it with gif_creator (a screenshot before starting and before stopping) and export it with `download: true` and a filename that names the bug.
7. Save shakedown.json, so a run that stops loses nothing.

Redraw after each feature, so the user can watch it fill in: `board.mjs <json> scenarios walkthroughs`.

On every page you pass through, also watch for what [references/watch.md](references/watch.md) lists. Anything wrong that no scenario covers becomes a new scenario on that feature, `type: found`, with status `fail`.

- A native `confirm()` or `alert()` blocks the extension. Warn the user before clicking anything that might raise one.
- After two or three failed attempts at the same action, stop and ask the user instead of retrying.

## 6. Base

Unless Base is skipped, repeat each failed scenario's exact steps on base, its database check included, with a screenshot of each step in `base_shots`, the same shape as `shots`. Add `b` to the run id in its markers and its query (`(shakedown k3x9b F1.U3)`), so rows head stored never count as base's. Run the check through `app.base`'s command, proven against base's database the same way as head's. Base may lack a column the change added: adapt the query. Batch them so the user switches the app once. Set `verdict`:

| Base | Head | `verdict` |
|---|---|---|
| works | broken | `regression` |
| broken | broken | `already-broken` |
| doesn't exist | broken | `defect` |

When Base is skipped, failures get no `verdict`.

## 7. Prove

For each regression and defect, or each failure when Base was skipped, write one browser test in the project's browser test framework that fails on head. Find the framework, its helpers and the command that runs one file from the dev dependencies, the test directory and the CI config. Reuse its helpers, build state the way the app's real write path would, and assert the database as well as the page when the database check failed. A regression's test must also pass on base. Leave the tests uncommitted and set `test` on the scenario: each is the failing test to start from if the user chooses to fix it. With no browser test framework in the project, skip this step and say so. A UI, consistency or confusing-behavior finding that no assertion captures keeps its screenshot as the evidence.

## 8. Report

1. Draw the final board: `board.mjs <json> features success unexpected scenarios walkthroughs`. It writes the page images, the scenario and step shots and a copy of the `.tldraw` file to `<scratch>/shakedown/out/`. Copy any GIFs from ~/Downloads there too. Look at `out/scenarios.jpg` once before posting.
2. With a PR, publish the files: `<this skill's directory>/scripts/publish-assets.sh <pr> <scratch>/shakedown/out`. It commits them to the repo's `shakedown-assets` branch under `pr-<n>/<timestamp>/` and prints the URL prefix. Image links take `<prefix>/<file>?raw=true`, with spaces in the file name written as `%20`. In a private repo only people with access see them, the same as the PR.
3. With a PR, post the comment with `gh pr comment <pr> --body-file <file>`. Open it in Chrome and confirm the images render. If they don't, say so in chat with the comment's URL.
4. Add each `found` scenario to its feature's file.
5. Give the report in chat, with the comment's URL, the doc's path, and the feature files created and updated, for the user to commit with the change.

The report and PR comment formats are in [references/report.md](references/report.md).

## Database checks

Every scenario that creates, updates or deletes data, or should have refused to, gets a `db` check: a query, the rows it should return, and after testing, the rows it did. This is F1.S2's, which removes a line from the order F1.S1 created:

```json
"db": {
  "query": "select l.product, l.quantity, l.deleted_at from order_lines l join orders o on o.id = l.order_id where o.reference like '%(shakedown k3x9 F1.S1)%' order by l.id",
  "expect": "1 row: Blue mug, quantity 2, not deleted",
  "before": "2 rows: Blue mug × 2, Red mug × 1",
  "actual": "2 rows: Blue mug × 2, and the removed Red mug × 1 still there"
}
```

- **Markers.** A scenario's marker is `(shakedown <run> <scenario id>)`, like `(shakedown k3x9 F1.S1)`. Put it at the start of the field, so a value the app cuts short or a length-limit scenario still keeps it: a marker at the end of a 256-character note is the first thing truncation drops, and the check then finds no row and passes falsely. Match it whole, parentheses included (`like '%(shakedown k3x9 F1.S1)%'`), so F1.S1 never matches F1.S10 and a query never matches someone else's data. A scenario that changes or deletes a record finds it by the marker of the scenario that created it, which its `setup` names. When a record has no text field the scenario fills (a required-fields-only create, an edit that clears the only text field), find it by the values it was given and `created_at` after the run started, or by the id read in an earlier check, and say so in `db.expect`. A scenario whose own `setup` creates its record, rather than reusing another scenario's, marks it with its own id.
- **Only read.** Pipe each query to `app.db` after its engine's read-only statement, so a mistake in a query can't write: `SET SESSION TRANSACTION READ ONLY;` for MySQL and MariaDB, `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;` for Postgres, `PRAGMA query_only = ON;` for SQLite. For example, `printf '%s\n' 'SET SESSION TRANSACTION READ ONLY;' "<query>" | ./vendor/bin/sail mysql`. Set data up through the app, the way a user would, never by writing to the database.
- **No rows proves little.** A check that expects nothing (a refused create, a hard delete) only counts if the same query can find rows: `db.before` shows it for a delete, and a refused create reuses the query of a scenario that did store.
- **What to check.** What the screen can't show: each field stored as entered (trimming, case, decimals, the timezone of dates and times), child rows under the right parent, no duplicates after an update, deleted rows gone or soft-deleted by the app's convention and their children with them, owner, tenant and audit columns set, and for a refused action, nothing stored or changed.

## shakedown.json

```json
{
  "title": "PR 142 shakedown, d38c9f9 vs develop",
  "target": { "kind": "pr", "ref": "142", "head": "d38c9f9", "base": "develop" },
  "run": "k3x9",
  "app": {
    "url": "http://localhost",
    "role": "Agent",
    "writes": true,
    "db": "./vendor/bin/sail mysql",
    "base": { "url": "http://localhost:8081", "db": "./vendor/bin/sail mysql" }
  },
  "out_of_scope": [{ "what": "Migration adding order_lines.position", "why": "No visible effect on its own; F1.S3 covers the ordering it enables" }],
  "features": [
    {
      "id": "F1",
      "name": "Add several lines to an order",
      "kind": "new",
      "pages": [{ "name": "Order sidebar", "url": "http://localhost/orders?order=new" }],
      "via": ["resources/js/Pages/Orders/OrderSidebar.tsx", "app/Http/Requests/StoreOrderRequest.php"],
      "tables": ["orders", "order_lines"],
      "expected_from": ["openspec/changes/order-lines/specs/orders/spec.md", "PR description"],
      "file": ".shakedown/features/add-several-lines-to-an-order.md",
      "retire": [{ "id": "U4", "why": "An order has no single product field any more" }],
      "scenarios": [
        {
          "id": "F1.S2",
          "type": "success",
          "op": "update",
          "origin": "changed",
          "change": "The Remove button moved into each line row",
          "title": "Remove one line from a saved order",
          "setup": "F1.S1's order, with Blue mug × 2 and Red mug × 1",
          "steps": ["Open the order", "Remove the Red mug row", "Save", "Reload"],
          "expected": "Only Blue mug × 2 is listed after reload, and the orders list reads 2 items",
          "db": { "query": "…", "expect": "…", "before": "…", "actual": "…" },
          "status": "fail",
          "actual": "The sidebar shows one row, but a reload brings the Red mug back",
          "evidence": "PUT /orders/88 returned 200",
          "severity": "major",
          "why": "A line the agent removed still ships to the customer",
          "verdict": "defect",
          "shots": [
            { "step": 1, "image": "/abs/path/step-1.png" },
            { "step": 2, "image": "/abs/path/step-2.png" },
            { "step": 3, "image": "/abs/path/step-3.png" },
            { "step": 4, "image": "/abs/path/step-4.png" }
          ],
          "image": "/abs/path/step-4.png",
          "test": "tests/Browser/OrderLinesTest.php::it removes a line"
        }
      ]
    }
  ]
}
```

- `target.kind` is `pr`, `branch`, `spec` or `area`. `kind` on a feature is `new`, `changed`, `reached` or `existing`.
- `run` goes in every marker. `app.base` is there only when Base runs.
- Scenario ids are `F1.S1` for success, `F1.U1` for unexpected use, `F1.X1` for one found during testing. An id never changes once given, so the board, the report and the tests agree.
- `type` is `success`, `unexpected` or `found`. Unexpected and found scenarios carry a `category`: the heading in unexpected.md or watch.md they came from, in lowercase.
- `op` is `create`, `update` or `delete`, on scenarios that write.
- `expected` is null only while it's an open question, with `question` beside it. `risk` says why an unexpected scenario might break, with file and line.
- `file` is the feature's file, existing or to be written. `origin` is `file`, `changed` (with `change`: what was updated) or `new`, on every scenario of a feature that has a file. `retire` lists the file's scenarios proposed for removal, with why. `decision` holds the reason, who and when behind an answered question, for the file's `Decision:` line.
- `status` is `planned`, `pass`, `fail` or `not-tested`, set from Phase 4 on. `why` is required for `fail` and `not-tested`. `actual`, `evidence` and `severity` come with a `fail`, `verdict` after Base, `test` after Prove. `db.before` is set for updates and deletes.
- `shots` has one entry per step done, in order, from Test on. `step` is the step's number, counting from 1. `note` says why a step couldn't be done. `base_shots` is set after Base, for failed scenarios.
- board.mjs writes `board` (the doc it created, and its new path if the user moves it) into the file, and changes nothing else in it. Leave it alone; it's how later runs find the doc. It also appends a timestamp to the doc's name, so a title can repeat across runs.
