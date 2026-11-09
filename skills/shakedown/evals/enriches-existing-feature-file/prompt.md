---
tags: [shakedown, planning, feature-files]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/shakedown:shakedown notes http://localhost

Shake down the ticket notes feature as it is today; no PR or branch. This machine has no tldraw or Chrome, so only do the planning: skip drawing the board, and write shakedown.json to ./shakedown/shakedown.json. Treat the feature list as confirmed, and treat the scenario list as approved as you propose it, retirements included, with any open questions left open. Then do what happens after approval, and stop before testing. I'm signed in as Agent, writes are fine, and the database is MySQL, read with `mysql app`. There's no second user.
