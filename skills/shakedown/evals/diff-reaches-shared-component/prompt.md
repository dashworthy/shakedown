---
tags: [shakedown, planning]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/shakedown:shakedown http://localhost

Shake down this branch against main; there's no PR yet. This machine has no tldraw or Chrome, so only do the planning: skip drawing the board, write shakedown.json to ./shakedown/shakedown.json, and stop at the approval stop with the scenario list. Treat the feature list as confirmed when you get there. I'm signed in as Agent, writes are fine, base is at http://localhost:8081, and the database is MySQL, read with `mysql app`, shared by head and base.
