# The project file

A shakedown needs a few facts about the project it runs in. They live in `.claude/shakedown.md` in the target repo. Read it first if it exists. Discover whatever it doesn't say, and at the end of the run offer to save what you discovered there, so the next run starts from it.

| Fact | Used in | Discover it from |
|---|---|---|
| Where routes are defined | Step 1 | The framework's router files (`routes/`, `app/` or `pages/` directories, a router config) |
| Where pages and components live | Step 1 | The frontend source tree; how pages import components |
| How the frontend calls the backend | Step 1 | An SDK or API client directory, fetch hooks, form actions |
| The component catalog | UI consistency | A catalog or index file, Storybook stories, or the shared components directory itself |
| The theme | UI consistency | Theme, tokens or design-system files; Tailwind or CSS variable config |
| Where the change's specs live | Step 1 | OpenSpec, ADRs, or a specs or docs directory; else the PR description alone |
| The browser test framework, its directory, helpers and run command | Step 5 | Dev dependencies (Pest browser, Laravel Dusk, Playwright, Cypress), the test directory, CI config |
| Steps to run before a browser test | Step 5 | Docs or CI config: asset builds, a test database, a container stack |
| The app's usual URL and how base is served | Before starting | README or local dev docs |

Write the file as short sections under these headings, each a few lines with paths and commands:

```markdown
# Shakedown

## App
<usual URL pattern, how to sign in, which roles exist, how to serve base>

## Routes and pages
<router files, pages directory, client SDK directory>

## Components
<catalog path, shared component directory, theme file, components the app expects to be reused (dialogs, sidebars, toolbars, grids, forms)>

## Specs
<where a change's specs live>

## Browser tests
<framework, directory, helpers to reuse, the command that runs one file, setup before it runs>
```
