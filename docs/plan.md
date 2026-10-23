# Plan

What the MoonCellar team is working on, task by task. The status hub (`status.mooncellar.space`,
admins only) shows this file as the MoonCellar project's Plan: CI uploads it on every push to
`main` that changes it (`scripts/upload-plan.ts`, [status hub](./status-hub.md)).

## How to use it

- A task is a row of a section table: `| id | task | who | depends | done when | size |`. The id is
  the section's letter and a number (`H3`); put `✓` after it when the task is done.
- **Who** is the person leading the task; an empty cell or `—` means it is free. **Depends** lists
  the ids that must be done first; until they are, the hub shows the task as waiting.
- Sizes: S — a day or less, M — a few days, L — a week or more.
- Never type a literal `|` inside a cell: it splits the row.

## H. Status hub

| # | Task | Who | Depends | Done when | Size |
|---|---|---|---|---|---|
| H1 ✓ | Project status hub at `status.mooncellar.space`: sign-in with the site account, admins only, a menu of projects, a page per project from its Plan and Decompilation blocks, Manage projects with upload tokens | sergeyhist | — | An admin sees the projects and their blocks; anyone else sees "No access" | L |
| H2 ✓ | A decompilation project uploads its Decompilation and Plan blocks after every merge into its `main` | sergeyhist | H1 | Its page in the hub follows its `main` | S |
| H3 | This plan in the hub: `docs/plan.md` parsed, checked against `PlanBlockSchema` and uploaded by CI with the project's token | sergeyhist | H1 | Changing this file updates the MoonCellar page in the hub | S |
| H4 ✓ | One upload token per machine or CI, revocable one by one, and connecting from the terminal: the hub's `/connect` page hands a one-time code to the waiting command, which exchanges it for its own token | sergeyhist | H1 | `bun scripts/hub-connect.ts <project>` saves a working token after one click in the browser | M |
| H5 | The plan lives in the hub: sections and tasks in the database, edited on the site (take, release, done, new task or section) and through the API by agents with a project token; projects import their plans and stop keeping them in files | sergeyhist | H4 | Someone without an agent takes a task, finishes it and adds a new one on the site, and the project's tools see it | L |
