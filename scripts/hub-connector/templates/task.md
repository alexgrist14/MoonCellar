---
description: Take a task of the plan of {{the project's name}} (it lives in the status hub) and do it, or list the free ones
argument-hint: "[task id]"
---

A task of the plan. Id: $ARGUMENTS (empty — show the free tasks and ask).

The plan lives in the status hub (`{{node or bun}} .claude/hub/tasks.mjs url`), not in the
repository: people take, finish and add tasks on the site, so read its state from the hub every
time, never from memory. Every task has an id (section letter and number, `A3`), what to do, where,
what it depends on, when it is done and a size (S — a day or less, M — a few days, L — a week or
more).

By running this command the user allows you to take, release, finish and add tasks in the hub
(`{{node or bun}} .claude/hub/tasks.mjs`), and to commit the task's work to a branch and
{{how a change reaches the main branch here, e.g. "open a pull request for it (gh pr create)"}}.
Never push to `{{the default branch}}`. Merge only when the user's rules allow it, and only
{{what must pass first, e.g. "a pull request with passing checks"}}; otherwise it waits for a person.

Preparation: `{{node or bun}} .claude/hub/tasks.mjs list --free` answers "No hub token" — ask the
user to run `/hub` and stop.

1. `{{node or bun}} .claude/hub/tasks.mjs list` — tasks and their state: "free", "led by …",
   "waits for …" (tasks it depends on are not done), "done". No id given — show the free ones
   (`--free`), ask which one to take, and stop.
2. `{{node or bun}} .claude/hub/tasks.mjs show <id>`. If it waits for other tasks, say which and
   stop (take it only if the user confirms).
3. Take it: `{{node or bun}} .claude/hub/tasks.mjs take <id>` (it acts as git `user.name` in lower
   case; `--as` for someone else). A 409 means someone else leads it: say who and stop (`--force`
   only when the user explicitly asks).
4. Branch from a fresh `{{the default branch}}`: `git fetch origin`, then
   `git switch -c {{the branch name, e.g. task/<id>-<short-name> with the id in lower case}} origin/{{the default branch}}`.
5. Do the task so that its "done when" holds, following the project's rules
   ({{where they are written, e.g. CLAUDE.md, AGENTS.md, CONTRIBUTING.md}}), and update the docs that
   describe what you changed. Run the checks of what you touched: {{the commands that check a
   change, e.g. "npm run lint", "npm test"; "none yet" if the project has none}}.
6. Commit ({{the commit message convention, e.g. Conventional Commits}}), push the branch and
   {{open the pull or merge request, e.g. "gh pr create" or "glab mr create"}}; its description names
   the task ("Task: A3 in the status hub") and what was checked.
7. When it is merged{{, and deployed, if the project deploys}}:
   `{{node or bun}} .claude/hub/tasks.mjs done <id>`.
8. Found a new task on the way — add it and say so:
   `{{node or bun}} .claude/hub/tasks.mjs add <section> "<task>"` with `--where`,
   `--depends <ids>`, `--done-when` and `--size S|M|L`; the hub picks the number. A new section:
   `{{node or bun}} .claude/hub/tasks.mjs section "<title>"`.

At the end: what was done, whether "done when" holds, the {{pull or merge request}} and whether it
was merged, whether the task is marked done, and which tasks it freed.
