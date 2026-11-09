---
type: llm
focus: trace
weight: 1
---

A scenario reopens the edit form and saves without changes, and its db check expects order_lines unchanged (no rows deleted and re-inserted), pointing at OrderController's update deleting and re-creating lines.
