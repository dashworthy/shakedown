---
tags: [shakedown, planning]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/shakedown:shakedown openspec/changes/order-lines http://localhost

This machine has no tldraw or Chrome, so only do the planning: skip drawing the board, write shakedown.json to ./shakedown/shakedown.json, and stop at the approval stop with the scenario list. Treat the feature list as confirmed when you get there. I'm signed in as Admin, writes are fine, and the database is MySQL, read with `mysql app`. There is no second user without permissions.

Input files: openspec/changes/order-lines/proposal.md, openspec/changes/order-lines/specs/orders/spec.md, app/Http/Requests/StoreOrderRequest.php, app/Http/Controllers/OrderController.php, app/Models/Order.php, database/migrations/2026_10_01_000000_create_orders_tables.php, resources/js/Pages/Orders/OrderForm.tsx, routes/web.php
