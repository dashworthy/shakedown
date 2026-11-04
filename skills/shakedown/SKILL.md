---
name: shakedown
description: Shake down a change in the running app with Claude in Chrome before it merges. Maps the diff to every page, link and form it reaches, walks each one for broken or missing behavior, regressions, broken links and forms, bad UI, UI inconsistency (including new components or patterns that duplicate existing ones) and confusing behavior, and re-runs suspected regressions on the base branch. Screenshots every behavior it tests onto a tldraw board, posts the board, findings and coverage as a PR comment, and leaves a failing browser test for each confirmed bug. Report-only, never edits app code. Use when asked for a shakedown, browser review, UI review, QA pass, smoke test or click-through of a PR or branch. Accepts an optional target (PR, branch or diff) and the app's URL.
disable-model-invocation: true
argument-hint: "[PR, branch or diff] [app URL]"
---

# Shakedown

Code review reads the diff and the test suite proves what someone thought to test. A shakedown uses the app the way its users do, on every page the change reaches, and reports what they would hit. It finds and proves. It never edits app code: the person running it decides what gets fixed.

- What to check on each page: [references/checks.md](references/checks.md). Read it before step 2.
- The project file, and what to discover without one: [references/project.md](references/project.md). Read it before step 1.

## Before starting

The target defaults to the current branch against its PR's base (`gh pr view --json number,baseRefName`), else the repo's default branch. With no PR, everything runs except the PR comment; say so in the report.

Check the tools before opening Chrome:

- tldraw Desktop is running: `curl -s http://localhost:7236/`. If it fails, ask the user to start it.
- The Claude in Chrome tools are available.

Ask the user, in one AskUserQuestion, for whatever the arguments and the project file didn't give:

- **Head URL.** Where the change is running, built from its head commit.
- **Base.** How step 4 reaches the base branch: a second URL, or the user switches the app when asked.
- **Login.** The user signs in to Chrome themselves; never type credentials. Ask which role they're signed in as, and whether a user without the change's permissions is available for the permission checks.
- **Writes.** Whether forms may create, edit and delete data there. If not, test validation and cancel paths only and mark the rest "not tested: writes not allowed".

## Workflow

1. **Impact map.** List every page the change reaches, walking up from each changed file:
   - A page or view maps to its route.
   - A component or hook reaches every page that imports it, directly or through another component.
   - A controller, request validator, serializer, service, query, model or permission reaches its routes, then every page and client call that uses them. Server-defined grids, filters, charts and map layers render on pages whose frontend code never changed.
   - A renamed or removed route reaches every link to it.

   For each page, gather the expected behavior: the change's specs if the project keeps them, and the PR description.

   Show the user a table (page, URL, the changed file that reaches it, what changed for the user, flows to test) with the flow count, then continue.

2. **Plan.** Pages the change edits directly get every facet in checks.md that applies. Pages reached only through shared code get the regression smoke from checks.md.

3. **Walk.** In Chrome:
   - Load the tools in one ToolSearch: tabs_context_mcp, tabs_create_mcp, navigate, computer, read_page, find, form_input, get_page_text, read_console_messages, read_network_requests, gif_creator, resize_window. Work in a new tab, never the user's.
   - After each page load and each action, read console messages and network requests with `clear: true`, so each error is tied to the action that caused it.
   - Screenshot every behavior you check, passing or not, with `save_to_disk: true`, at the moment that shows the result. Add it to the manifest (below) as soon as it's taken, so the board and the coverage table come from the same list.
   - When something looks wrong, write down the exact steps. For a bug that takes several steps to show, also record it with gif_creator (a screenshot before starting and before stopping) and export with `download: true` and a filename that names the bug.
   - Prefix any data you create with `shakedown` so the user can find and clean it up. Never delete data you didn't create.
   - A native `confirm()` or `alert()` blocks the extension. Warn the user before clicking anything that might raise one.
   - After two or three failed attempts at the same action, stop and ask the user instead of retrying.

4. **Base.** Repeat each suspected regression's exact steps on base. Batch them so the user switches the app once. Classify:

   | Base | Head | Verdict |
   |---|---|---|
   | works | broken | **Regression** |
   | broken | broken | **Already broken** |
   | doesn't exist | broken | **Defect in new behavior** |

5. **Prove.** For each confirmed regression, defect, broken link or broken form, write one browser test in the project's browser test framework that fails on head. Reuse its existing helpers, and build state the way the app's real write path would. A regression's test must also pass on base. Leave the tests uncommitted and list them: each is the failing test to start from if the user chooses to fix it. With no browser test framework in the project, skip this step and say so. A UI, consistency or confusing-behavior finding that no assertion captures keeps its screenshot as the evidence instead.

6. **Report.**
   1. Build the board: `node <this skill's directory>/scripts/board.mjs <scratch>/shakedown/manifest.json <scratch>/shakedown/out`. It makes one frame per page with a captioned shot per behavior, colored by status, and writes the shots, `board.jpg` and the `.tldraw` file to `out/`. Copy any GIFs from ~/Downloads into `out/` too. Look at `board.jpg` once before posting.
   2. Publish the files: `<this skill's directory>/scripts/publish-assets.sh <pr> <scratch>/shakedown/out`. It commits them to the repo's `shakedown-assets` branch under `pr-<n>/<timestamp>/` and prints the URL prefix. Image links take `<prefix>/<file>?raw=true`. In a private repo only people with access see them, the same as the PR.
   3. Post the PR comment (template below) with `gh pr comment <pr> --body-file <file>`. Open the comment in Chrome and confirm the board and a shot render. If they don't, say so in chat with the comment's URL.
   4. Give the report in chat, with the comment's URL.

`<scratch>` is the session's scratchpad directory if it has one, otherwise a `mktemp -d` directory.

## Manifest

`<scratch>/shakedown/manifest.json`, one entry per behavior checked, in the order tested:

```json
{
  "title": "PR 142 shakedown, d38c9f9 vs main",
  "pages": [
    { "name": "Orders", "url": "http://app.test/orders", "shots": [
      { "behavior": "Cancel an order from the toolbar", "status": "finding", "finding": 1, "why": "the 422 shows only in a toast, so the user can't tell which field to fix", "image": "/abs/path/from/save_to_disk.png" }
    ] }
  ]
}
```

`status` is `pass`, `finding`, `already-broken` or `not-tested`. `finding` is the report's finding number. `why` is required for every status but `pass`: for a problem, what it costs the user or breaks (not a restatement of what happened); for `not-tested`, the reason, and it has no `image`. The title must be new each run: the board script won't overwrite a board.

## Report

Sections in this order: regressions, defects in new behavior, broken links and forms, already broken, UI and consistency, confusing behavior, then coverage. Within a section, rank by severity:

- **Blocker:** data loss, a page that doesn't load, or a flow that can't be completed.
- **Major:** a wrong result, or a regression with a workaround.
- **Minor:** works, but confusing or inconsistent.
- **Polish:** cosmetic.

Write each finding as a ticket someone else can pick up:

````markdown
#### 1. <what the user sees, e.g. "Saving an order with no reason shows a toast but no field error">

**Severity:** <blocker | major | minor | polish>, <why>
**Page:** <URL>, reached through <changed file>
**Steps to reproduce:** <numbered, from a fresh page load>
**Expected:** <...> **Actual:** <...>
**Why it's a problem:** <what it costs the user or breaks: lost work, a wrong record, a dead end, a second way to do the same thing>
**Evidence:** <screenshot or GIF, plus the console or network line>
**Base:** <works | broken | doesn't exist | not checked>
**Test:** `<path>::<test name>`, head fail, base <pass | n/a> | none: <why>
**Suggested fix:** <one line, with a time estimate>
````

End with a coverage table: one row per page from step 1, one column per facet, each cell pass, finding number, or "not tested" with the reason. It is how the reader tells "nothing found" from "not checked".

## PR comment

````markdown
## Shakedown: <head sha> vs <base>

<pages> pages, <behaviors> behaviors checked. **<n> regressions, <n> defects, <n> already broken, <n> UI and consistency, <n> confusing.** Tested at <URL> as <role>.

![Board](<prefix>/board.jpg?raw=true)

### Findings
<one line per finding: severity, title, verdict, a link to its shot. Each wraps its full ticket in <details>.>

### Coverage
<the coverage table>

<one <details><summary><page name></summary> per page, with each behavior's caption above its shot>

Failing tests (uncommitted, in the reviewer's checkout): <list, or none>.
Board: [<file>.tldraw](<prefix>/<file>.tldraw?raw=true), opens in tldraw Desktop.
````
