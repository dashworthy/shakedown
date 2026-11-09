# Unexpected use

Ways a user makes a feature misbehave without meaning to. For each feature, go through every heading and write the scenarios that apply to its inputs, its records and its pages. Put first the ones the code points at: a missing rule, a constraint with no validation in front of it, a check only the UI makes.

Each scenario says what should happen on screen and in the database. For most, the database should show nothing stored or nothing changed. Check it anyway: a form that shows an error after saving half the record is the bug.

Contents: missing input, questionable input, boundaries, sequence and timing, persistence, wrong state, permissions, writing a scenario.

## Missing input

- Each required field left empty, one at a time, then all at once.
- Every optional field left empty: the record still saves and displays sensibly, with no "null", "undefined" or "Invalid date".
- Nothing selected when an action needs a selection. An empty list where the form needs at least one row.
- A file input submitted with no file, or with an empty file.
- A dependent field left behind: choose a parent and its child, then clear the parent.

## Questionable input

- Too long: one character over the limit, and a very long value (500 or more characters, no spaces). Compare the form's limit, the server's rule and the column's size: they often disagree.
- Numbers: zero, negative, a decimal where a whole number is expected, a very large number, leading zeros, a number with commas or units ("1,000", "5 yd").
- Text: only spaces, leading and trailing spaces, emoji and accented letters, apostrophes and quotes ("O'Brien"), HTML (`<b>x</b>`) and script-like text, pasted text with line breaks.
- Dates and times: an end before its start, the same start and end, the far past, the far future, 29 February, a time near midnight or a daylight-saving change, a browser timezone different from the tenant's.
- Duplicates: the same name or number as an existing record, the same item added twice to a list.
- Combinations the UI allows but that make no sense: a size not offered for that type, a date outside the parent record's range.
- Files: the wrong type, too large, an extension that lies about the content.

## Boundaries

- Exactly at each limit (maximum length, maximum quantity, earliest date) and one past it.
- The first and the last: the first page of a list, the last page, a list with one row, the last child of a record.

## Sequence and timing

- Double-click Save: one request, one record.
- Save, press Back, and save again.
- Refresh, or close the tab, partway through: a half-filled form, an open dialog. Closing with unsaved changes asks before discarding them.
- Cancel at each step of a multi-step flow: nothing half-saved is left behind.
- Fast repeated actions: toggling, adding and removing rows quickly.

## Persistence

- Validation fails on a later step or a nested row: nothing from the earlier steps or rows is stored.
- Two tabs on the same record: save a change in one, then save stale values in the other. Is the first change lost silently?
- Act on a record that changed underneath: deleted, closed or reassigned in another tab, then edited or deleted here.
- Delete a record that other records use: refused with a reason, or handled as the spec says.
- Delete, press Back to its edit form, and save.
- Remove every child row and save: allowed or refused as the spec says, and the database matches what the screen shows.
- Edit and save without changing anything: nothing changes in the database, and child rows aren't deleted and re-inserted.

## Wrong state

- A record in each state the feature shouldn't accept: closed, cancelled, completed, locked, archived. The action is hidden or disabled and says why, and opening its URL directly refuses.
- Empty: no rows, no records, a filter with no matches. Each shows an empty message, not a blank area.
- Long values on display: long names, notes and addresses wrap or truncate with a tooltip, and never push controls off screen.
- Volume: many rows, many children on one record (fifty lines), many map pins.

## Permissions

- A user without the permission: the action is hidden or disabled, never enabled and failing on click.
- That user opening the URL directly: a no-permission page or a 403, never the data.
- Another customer's or tenant's record, reached by changing the id in the URL.
- A role the spec grants the feature to can use it.

## Writing a scenario

Bad: "Test an invalid quantity."

Good: "F1.U3 · questionable input. Set a line's quantity to 0 and save. Should: an error under Quantity, and nothing stored (DB: no order_lines rows under the order marked '(shakedown k3x9 F1.U3)'). Risk: StoreOrderRequest.php:28 has `integer` but no `min:1`, so only the input's `min` attribute stops it."
