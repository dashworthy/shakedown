---
type: llm
focus: trace
weight: 1
---

No scenario step joins two user actions (for example "Click Attachments, switch the file picker to All files, and choose x.exe" or "Paste the link and press Enter"): each step is one open, click, type, select, switch, save or reload, and a tab switch or a dialog answer is its own step.
