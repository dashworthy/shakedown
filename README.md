# shakedown

![shakedown — Shake down a PR in the running app before it merges.](art/banner.svg)

A Claude Code plugin that shakes down a change, or a whole feature area, in the running app.

Code review reads the diff, and the test suite proves what someone thought to test. shakedown
first writes down everything there is to test: every feature in scope, every way to prove each
one works, and every way a user could make it misbehave. You approve that list. Then it runs
every scenario in Chrome the way a user would, and checks the database behind each one. It is
**report-only**: it finds and proves, and never edits app code.

## How a run goes

Each planning phase is a page of one tldraw doc, so you watch the plan grow and correct it at
two stops.

1. **Features.** Every feature in scope, from a PR or branch diff (including pages reached
   only through shared components, services or routes), a spec, or a feature area you name.
   **Stop:** you confirm the list, in chat or with notes on the board.
2. **Success.** Every way to prove each feature works: each spec scenario, entry point, valid
   input, role and state, and create, update and delete for every record it writes. Complex
   forms get a round trip: create, reopen, save unchanged, edit nested rows, delete.
3. **Unexpected use.** Every way a user could make it misbehave: missing and questionable
   inputs, boundaries, double submits and stale tabs, half-saved records, wrong states, wrong
   roles. Each is grounded in the validation, constraints and permission checks in the code.
4. **Scenarios.** The two lists compiled into one, per feature. **Stop:** you answer the open
   questions (what *should* happen where nothing says) and approve the list.
5. **Test.** Each scenario in Chrome, with a screenshot of every step, the console and network
   read after every action, and a read-only database query proving what was stored, changed or deleted.
6. **Base.** Each failure repeated on the base branch: regression, already broken, or a defect
   in new behavior. Skipped for a feature area, or a spec with no diff.
7. **Prove.** A failing browser test for each confirmed bug, left uncommitted.
8. **Report.** Ticket-style findings and a results table per feature, posted to the PR.

## Requirements

- Claude in Chrome, with you signed in to the app you're testing
- [tldraw Desktop](https://github.com/tldraw/tldraw-offline), running, for the board
- A command that reads the app's database from the terminal, taking SQL on stdin
  (`./vendor/bin/sail mysql`, `docker compose exec -T db psql`, and the like)
- `gh`, authenticated, for the PR comment
- Node 18 or later

## Install

```
/plugin marketplace add dashworthy/shakedown
/plugin install shakedown@shakedown
```

## Use

```
/shakedown:shakedown [PR, branch, spec or feature] [app URL]
```

Both arguments are optional. With no target it shakes down the current branch against its PR's
base. It asks for anything it can't find: where the change is running, how to reach the base
branch's code, which role you're signed in as, and whether it may write data there.

## What you get

- A **tldraw doc** with five pages: Features, Success, Unexpected use, Scenarios, which
  fills in with a pass or fail and a screenshot per scenario as testing runs, and
  Walkthroughs, a captioned screenshot of every step of every scenario.
- **Step-by-step walkthroughs** in the PR comment: each scenario's steps, each with its
  screenshot, so anyone can repeat it by following the pictures.
- A **PR comment** with the board, the findings, the results table and every screenshot.
  Images are committed to a `shakedown-assets` branch in the same repo, so a private repo's
  images stay private.
- **Failing tests** for confirmed bugs, ready to start a fix from.

## Feature files

Approved scenarios are saved in your repo, one markdown file per feature, under
`.shakedown/features/`. The next run that reaches a feature starts from its file: it keeps what
still applies, updates what moved, proposes retiring what no longer exists, and adds what's new.
Each file also says what the feature is for, and records every decision about how it should
behave (who decided, when and why), so the knowledge stays with the code when people move on.
Anyone can read them, or test a feature by hand from them, without shakedown. Commit them with
the change, so the plan is reviewed like the code.

Every record it creates carries `(shakedown <run> <scenario id>)`, so you can find and clean up
its test data. Its database queries run read-only, and the database command never goes in the PR
comment.

## License

MIT © Andrew Leach
