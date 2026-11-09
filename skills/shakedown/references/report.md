# Report

The chat report and the PR comment, both built from shakedown.json.

## Sections

When Base ran, in this order: regressions, defects in new behavior, already broken, UI and consistency, confusing behavior, then results and notes. When it was skipped (a feature area, a spec with no diff): broken, UI and consistency, confusing behavior, results, notes.

A failed scenario goes in the section for its `verdict` (broken, when Base was skipped), except a `found` scenario in the `ui`, `consistency` or `confusing` category, which goes in its own section. Within a section, rank by severity:

- **Blocker:** data loss or corruption, a page that doesn't load, or a flow that can't be completed.
- **Major:** a wrong result, wrong data stored, or a regression with a workaround.
- **Minor:** works, but confusing or inconsistent.
- **Polish:** cosmetic.

Write each finding as a ticket someone else can pick up:

````markdown
#### <scenario id>. <what the user sees, e.g. "Removing a line from a saved order doesn't stick">

**Severity:** <blocker | major | minor | polish>, <why>
**Feature:** <feature id and name>, on <URL>, reached through <changed file>
**Steps to reproduce:** <numbered, from a fresh page load, starting with the setup, each step with its screenshot beneath it (see Walkthrough)>
**Expected:** <...> **Actual:** <...>
**Database:** `<query>` expected <...>, got <...> | not checked: <why>
**Why it's a problem:** <what it costs the user or breaks: lost work, a wrong record, a dead end, a second way to do the same thing>
**Evidence:** <screenshot or GIF, plus the console or network line>
**Base:** <works | broken | doesn't exist | not checked>
**Test:** `<path>::<test name>`, head fail, base <pass | n/a> | none: <why>
**Suggested fix:** <one line, with a time estimate>
````

## Walkthrough

Every scenario's steps, each with the screenshot taken after it, so a reader can repeat the scenario by following the pictures. The images are the step shots board.mjs writes to `out/` as `<scenario id>-step-<n>.jpg` (`<scenario id>-base-step-<n>.jpg` for Base):

````markdown
**Setup:** <setup>

1. <step 1>

   <img src="<prefix>/F1.S2-step-1.jpg?raw=true" width="480">
2. <step 2>

   <img src="<prefix>/F1.S2-step-2.jpg?raw=true" width="480">

**Result:** <expected> | <actual, for a fail>
````

Use `<img width="480">`, not `![]()`, so a long walkthrough stays readable. A step with a `note` says "Blocked: <note>" under its image, and a step with no shot says "(not reached)". A finding's ticket shows its walkthrough under Steps to reproduce, and its Base walkthrough under Base when Base ran. Each walkthrough appears once in the comment: a scenario with a finding has its walkthrough in the ticket only, and its line in the feature's section links to the ticket instead.

## Results

One row per feature. It is how the reader tells "nothing found" from "not checked".

```markdown
| Feature | Success | Unexpected | Found | Not tested | Create | Update | Delete |
|---|---|---|---|---|---|---|---|
| F1 Add several lines to an order | 5/6 | 9/11 | 1 | 2 | pass | F1.S2 | pass |
| F2 Orders grid item count | 3/3 | – | 0 | 0 | – | – | – |
```

Success and Unexpected are passed out of tested. Create, Update and Delete are `pass` when every scenario of that `op` passed, the first failing scenario's id, `not tested`, or `–` when the feature doesn't do it.

Under the table, one `<details>` per feature listing every scenario: id, status, title, and the `why` for anything not tested. Then name any of watch.md's checks that weren't done (no keyboard pass, one width only), so a skipped check doesn't read as a clean one.

## Notes

Gaps found in the code that a browser can't reach (a rule only a hand-crafted request would get past), checks that couldn't run (no way into the database, no user without the permission), and anything the user should know about the test data left behind (every record carries `(shakedown <run> <id>)`).

## PR comment

Never put `app.db` or anything from the env file in the comment: the comment is as public as the repo.

````markdown
## Shakedown: <head sha> vs <base>

<features> features, <scenarios> scenarios: <pass> pass, <fail> fail, <not tested> not tested. **<n> regressions, <n> defects, <n> already broken (or, when Base was skipped, <n> broken), <n> UI and consistency, <n> confusing.** Tested at <URL> as <role>, database <checked | not checked: why>.

![Scenarios](<prefix>/scenarios.jpg?raw=true)

### Findings
<one line per finding: severity, id, title, verdict, a link to its shot. Each wraps its full ticket in <details>.>

### Results
<the results table>

<details><summary>The plan: features, success and unexpected use</summary>

![Features](<prefix>/features.jpg?raw=true)
![Success](<prefix>/success.jpg?raw=true)
![Unexpected use](<prefix>/unexpected.jpg?raw=true)

</details>

<one <details><summary><feature id and name></summary> per feature. Inside it, one <details><summary><status> <scenario id> <title></summary> per scenario, holding its walkthrough, or for a scenario with a finding, one line linking to its ticket>

Failing tests (uncommitted, in the reviewer's checkout): <list, or none>.
Board: [<file>.tldraw](<prefix>/<file>.tldraw?raw=true), opens in tldraw Desktop.
````

GitHub rejects a comment over 65,536 characters. Walkthroughs make long comments common, which is one reason each appears only once: if it's longer, post the per-feature `<details>` as further comments, one or more features each, and link them from the first.
