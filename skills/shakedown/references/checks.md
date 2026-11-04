# Checks

What to look for on each page. Apply the facets that fit what the change did: a change to a grid's filters needs the forms and states facets, not the map one.

Contents: regression smoke, behavior, links and navigation, forms, states, console and network, permissions, UI, UI consistency, confusing behavior, keyboard and focus, live updates and locks, maps.

## Regression smoke

For pages reached only through shared code:

- The page loads with no console error and no request returning 400 or more.
- Its main job works: the list loads rows, the detail page shows its record, the map shows its pins.
- One form on it submits, or one action from its toolbar runs.

## Behavior

- Walk every spec scenario for the page. A scenario you couldn't reach is "not tested", with the reason.
- Reload after each write: the saved values are what was entered, including dates and times in the user's or tenant's timezone.
- The page updates after an action without a manual refresh: the list row, the counts, the selected record.
- Actions enable and disable with the selection: none, one, several, and a record in each state the action cares about.
- Bulk actions apply to every selected row and only those.
- Undo puts back exactly what the action changed.

## Links and navigation

- Every link, button, menu item, breadcrumb and tab on a changed page opens a page that loads: no 404, 403, 500 or blank page.
- List rows open the right record.
- A new page has its entry in the navigation, and its breadcrumb leads back.
- Refreshing a deep link, or opening it in a new tab, lands on the same state.
- Back and forward restore the previous page with its filters, sort and selection.
- After a route rename, no link still points at the old route.

## Forms

- A required field left empty, a value too long, a negative or zero number, a date range ending before it starts: each validation error shows next to its field, not only in a toast.
- A server error shows a message the user can act on, and the form keeps what they typed.
- Edit forms are prefilled, and fields that must not change are disabled.
- Double-clicking save sends one request.
- Closing a sidebar or dialog with unsaved changes asks before discarding them.
- After a save there is visible feedback, and the page behind shows the change.
- Autocompletes search, select and clear. Uploads accept a valid file and reject an invalid one with a reason.

## States

- Empty: no rows, no records, a filter with no matches. Each shows an empty message, not a blank area.
- Loading: a slow request shows a loading state, and controls can't be used half-loaded.
- Error: a failed load says so, and offers a retry or a way back.
- Long values: long names, notes and addresses wrap or truncate with a tooltip, and never push controls off screen.
- Volume: many rows page or scroll, and many map pins or chart points still render.
- Width: check at 1920px and 1280px with resize_window, and at phone or tablet width for pages meant for them.

## Console and network

- No JavaScript errors. No framework warnings, such as React's missing keys, controlled to uncontrolled inputs, or state updates after unmount.
- No request returns 400 or more unless the step expects it, such as a 422 on a validation check.
- One action sends one request per resource it needs: repeated identical requests mean a render loop or a missing dependency.
- A request taking over two seconds is worth reporting with its URL and time.

## Permissions

- With a user lacking the permission, the action is disabled or hidden, never enabled and failing on click.
- Opening the URL directly as that user shows a no-permission page or a 403, never the data.
- A new permission is granted to the roles the spec says.

## UI

- Alignment, spacing and sizing match the rest of the page.
- Icon buttons have tooltips. Disabled controls look disabled and say why on hover.
- Inputs have labels. Text has enough contrast to read.
- Nothing overlaps, clips or scrolls inside a panel that shouldn't scroll.

## UI consistency

Did the change make something that didn't need to exist? Check each new component, hook, style and pattern in the diff against the project's component catalog (see project.md):

- A new button, dialog, sidebar, toolbar, list page or form page where an existing component already does the job.
- Hard-coded colors, spacing or fonts instead of the theme and the existing classes.
- A page laid out differently from its siblings: a list page not built like the other list pages, actions somewhere other than where the app keeps them.
- Different words for an action the app already names ("Remove" where the app says "Delete"), or a new icon for an existing action.
- Dates, times, numbers or statuses formatted differently from the pages next to it.
- A new shared component missing from the catalog.

Report the existing component or page it duplicates, with its path, and a screenshot of both side by side.

## Confusing behavior

- An action with no visible result, or a result somewhere the user isn't looking.
- A label or message a user would read two ways, or that uses a different term from the rest of the app for the same thing.
- A dead end: a page or dialog with no way forward or back.
- A destructive action with no confirm, or a confirm on something harmless.
- State lost without being asked: the selection cleared, filters reset or scroll jumping after an action.
- An error that says what went wrong but not how to fix it.

## Keyboard and focus

- Every control on a changed page can be reached with Tab, in a sensible order.
- Enter submits the form it is in. Escape closes the dialog or sidebar.
- Focus returns to the control that opened a dialog or sidebar after it closes.

## Live updates and locks

When the change touches broadcast events, websockets, locks or records several people edit:

- Open the page in two tabs. A change in one shows up in the other.
- A record locked in one tab can't be edited in the other, and the second tab says who holds it.

## Maps

When the change touches a map:

- Layers turn on and off, and markers show the right look for their state.
- Popups open and their actions work.
- Map position and layer choices persist across a reload, if the app saves them.
- Selecting on the map and in the list stays in sync.
