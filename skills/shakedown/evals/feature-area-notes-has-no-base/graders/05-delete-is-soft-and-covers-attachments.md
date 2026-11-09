---
type: llm
focus: trace
weight: 1
---

The delete scenario's db check expects the note soft-deleted (deleted_at set, row kept), and the scenario's expectation or risk says what happens to the note's rows in note_attachments.
