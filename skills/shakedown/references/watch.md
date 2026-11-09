# Watch

What to watch on every page a scenario passes through. These aren't scenarios of their own: anything wrong here that no scenario covers becomes a `found` scenario on the feature, with its `category` named after the heading below.

Contents: console and network, links, states, UI, consistency, confusing, keyboard, width.

## Console and network

- No JavaScript errors. No framework warnings, such as React's missing keys, controlled to uncontrolled inputs, or state updates after unmount.
- No request returns 400 or more unless the scenario expects it, such as a 422 on a validation scenario.
- One action sends one request per resource it needs: repeated identical requests mean a render loop or a missing dependency.
- A request taking over two seconds is worth reporting with its URL and time.

## Links

- Every link, button, menu item, breadcrumb and tab on a changed page opens a page that loads: no 404, 403, 500 or blank page.
- After a route rename, no link still points at the old route.

## States

- Loading: a slow request shows a loading state, and controls can't be used half-loaded.
- Error: a failed load says so, and offers a retry or a way back.

## UI

- Alignment, spacing and sizing match the rest of the page.
- Icon buttons have tooltips. Disabled controls look disabled and say why on hover.
- Inputs have labels. Text has enough contrast to read.
- Nothing overlaps, clips, or scrolls inside a panel that shouldn't scroll.

## Consistency

Did the change make something that didn't need to exist? Check each new component, hook, style and pattern in the diff against the project's component catalog: a catalog or index file, Storybook stories, or the shared components directory itself, and its theme or design-token files.

- A new button, dialog, sidebar, toolbar, list page or form page where an existing component already does the job.
- Hard-coded colors, spacing or fonts instead of the theme and the existing classes.
- A page laid out differently from its siblings: a list page not built like the other list pages, actions somewhere other than where the app keeps them.
- A different word for an action the app already names ("Remove" where the app says "Delete"), or a new icon for an existing action.
- Dates, times, numbers or statuses formatted differently from the pages next to it.
- A new shared component missing from the catalog.

Report the existing component or page it duplicates, with its path, and a screenshot of both side by side.

## Confusing

- An action with no visible result, or a result somewhere the user isn't looking.
- A label or message a user would read two ways, or a different term from the rest of the app for the same thing.
- A dead end: a page or dialog with no way forward or back.
- A destructive action with no confirm, or a confirm on something harmless.
- State lost without asking: the selection cleared, filters reset, or the scroll jumping after an action.
- An error that says what went wrong but not how to fix it.

## Keyboard

- Every control on a changed page can be reached with Tab, in a sensible order.
- Enter submits the form it is in. Escape closes the dialog or sidebar.
- Focus returns to the control that opened a dialog or sidebar after it closes.

## Width

- Check changed pages at 1920px and 1280px with resize_window, and at phone or tablet width for pages meant for them.
