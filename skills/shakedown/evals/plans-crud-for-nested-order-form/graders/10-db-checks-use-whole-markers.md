---
type: llm
focus: trace
weight: 1
---

Every db query that can find its record by a marker uses one of the form `(shakedown <run> <scenario id>)`, matched with its parentheses so F1.S1 can't match F1.S10, and an update or delete scenario finds the record by the marker of the scenario that created it (its own marker when its own setup creates the record). A scenario whose record has no text field to hold a marker (only optional notes, left empty or cleared) finds it another way that can't match other data, and says so.
