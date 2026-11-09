---
type: llm
focus: trace
weight: 1
---

There are scenarios with op "create" and "delete" for notes, each with a db check that queries the notes table. The panel has no way to edit a note, so editing is not planned as a browser scenario: it is left out, or noted as reachable only by a hand-crafted request to notes.update.
