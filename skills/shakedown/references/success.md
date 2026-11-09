# Success

Where to find every way to prove a feature works. Go through each section for each feature; most features draw on several. Write one scenario per distinct outcome, not one per click.

Contents: sources, create update and delete, complex forms, smoke for reached features, writing a proof.

## Sources

- Every spec scenario and acceptance criterion.
- Every entry point: toolbar, row menu, detail page, sidebar, bulk selection, keyboard shortcut. One scenario each where they run different code or start from a different state.
- Every valid input that changes the outcome: only the required fields; every field; each option of a select, toggle or radio that changes what happens; one item and several; the smallest and largest valid values.
- Every role the spec grants, and every record state the feature should accept.
- Actions driven by a selection: enabled and disabled with none, one and several selected. A bulk action changes every selected row and only those.
- Navigation a new page needs: its menu entry and breadcrumb; a deep link and a refresh land on the same state; back and forward restore filters, sort and selection; each list row opens its own record.
- Live updates: the page updates after an action without a manual refresh. With broadcasting, a second tab sees the change.
- Maps, when the feature has one: layers turn on and off, markers show the right look for their state, popups' actions work, selecting on the map and in the list stays in sync, and the map position persists across a reload if the app saves it.

## Create, update and delete

For every record the feature writes, write scenarios for each operation the app lets a user do on it. Persistence bugs hide in update and delete more than in create, so don't stop at create. Each scenario gets a database check (SKILL.md, "Database checks").

**Create**

- Every field is stored as entered: text not trimmed or recased unless the app means to, numbers at their precision, dates and times in the right timezone, each select storing the chosen value.
- Defaults the user didn't touch are stored as the spec says.
- Child rows (lines, contacts, attachments) are created under the right parent, in the order shown.
- Owner, tenant, creator and history or audit rows are set.
- The new record shows everywhere it should: the list, the counts, its detail page, related pages.

**Update**

- Change each kind of field once: text, number, date, select, toggle, relation.
- Clear an optional field: it is stored empty (null or blank, by the app's convention) and displays as empty, never "null", "undefined" or "Invalid date".
- Children: edit one, add one, remove one, reorder them. Removing a child removes (or soft-deletes) that row only. No child is orphaned or duplicated, and the children you didn't touch keep their ids.
- Fields you didn't touch keep their values. The updated timestamp and the history change.
- Records that copy or count this one follow the change.

**Delete**

- The row is removed or soft-deleted, by the app's convention, and its children go the same way.
- Records that reference it: the delete is refused with a reason, or the references are handled as the spec says, never left pointing at nothing.
- It disappears from lists, counts, search and related pages, and stays gone after a reload.
- Restore, where the app has it, brings back the record and its children.

## Complex forms

A form with nested rows, several steps, or fields that depend on each other gets a round trip:

1. Create it with every section filled, nested rows included.
2. Reopen the edit form: every field, nested row and dependent choice is prefilled exactly as saved.
3. Save without changing anything: the database is unchanged. No duplicated or re-created children, and no history beyond what the app records for a save.
4. Change one field in each section and one nested row: only those change in the database.
5. Delete it: everything it created goes with it.

Dependent fields: change the parent after the child is chosen (a customer, then an address, then a different customer). The child resets or fails validation, and what's stored is consistent.

## Smoke for reached features

A feature reached only through changed shared code:

- Its page loads with no console error and no request returning 400 or more.
- Its main job works: the list loads rows, the detail page shows its record, the map shows its pins.
- One form on it submits, or one action from its toolbar runs, with a database check if it writes.

## Writing a proof

Bad: "Saving works."

Good: "After save and reload, the order lists Blue mug × 2 and Red mug × 1, and the orders list reads 3 items." DB: "2 rows in order_lines for the order: Blue mug quantity 2, Red mug quantity 1."
