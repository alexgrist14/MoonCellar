---
description: Set this repository up in the MoonCellar status hub — create or join its project, connect this machine, write /hub and /task and a note on the plan
argument-hint: "[project address]"
---

The status hub (https://status.mooncellar.space, MoonCellar admins only) keeps a project's plan:
sections of tasks that people take and finish on the site and agents through `/task`. This command
sets this repository up for it, once. Project address: $ARGUMENTS (empty — ask).

The hub connector is in `.claude/hub/`: two scripts (`tasks.mjs`, `hub-connect.mjs`) and the
templates of the files this command writes. Run the scripts from the repository root.

1. **Runtime.** `node --version` must be 18 or newer: the scripts run as
   `node .claude/hub/<script>.mjs`. No Node but Bun — use `bun` in place of `node` below and in the
   files you write. Neither — tell the user to install Node.js (https://nodejs.org) and stop.
2. **Already set up?** `.claude/status-hub.json` names the project this repository belongs to. If it
   exists, keep that project (unless the user asks for another one) and skip step 3.
3. **Which project.** Ask the user in one question, leaving out what $ARGUMENTS and the conversation
   already answer:
   - a new project, or one that is already in the hub (an admin may have added it in Manage
     projects);
   - its name (default: the repository's name) and address: 1–40 lowercase letters, digits and
     dashes, not starting or ending with a dash, and none of `login`, `manage`, `status`, `api`,
     `images`, `img`, `connect` (default: the name in that form);
   - for a new one, its blocks: `plan` (a plan of tasks, the usual choice), `decomp` (the progress of
     a decompilation, which the project's own tooling uploads) or both.
4. **Connect.** Run
   `node .claude/hub/hub-connect.mjs <address> --save --title "<name>" --blocks <blocks>` so that it
   keeps waiting while you answer (in Claude Code — Bash with `run_in_background`); `--title` and
   `--blocks` only for a new project. It prints a link and opens it in the browser. Tell the user to
   sign in with a MoonCellar admin account and press "Create and allow" (a new project) or "Allow"
   (not an admin — a hub admin has to open the link). It waits up to ten minutes, saves this
   machine's token to `~/.config/mooncellar/<address>-hub-token` and records the project in
   `.claude/status-hub.json`. "Not connected" or ten minutes passed — say what it answered and stop.
5. **Check.** `node .claude/hub/tasks.mjs list` answers without an error (a new plan says
   "No tasks.").
6. **Commands.** Write `.claude/commands/hub.md` and `.claude/commands/task.md` from
   `.claude/hub/templates/hub.md` and `.claude/hub/templates/task.md`. Every `{{…}}` says what goes
   in its place: find it in the repository — `README`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING`,
   `package.json` scripts, `Makefile`, CI workflows, `git remote -v`, the default branch
   (`git symbolic-ref refs/remotes/origin/HEAD`) — and ask the user only what the repository does not
   say. No `{{` may stay in the written files. If either file already exists, show how yours differs
   and ask before replacing it.
7. **The note on the plan.** Add the section in `.claude/hub/templates/plan-section.md`, filled the
   same way, to the repository's agent instructions: `CLAUDE.md`, or `AGENTS.md` when the project
   keeps its rules there and `CLAUDE.md` only points to it. No such file — create `CLAUDE.md` with
   just that section. A section about the hub that is already there gets updated, not repeated.
8. **A plan to bring.** If the user has tasks to start with (a list, a markdown plan, issues), offer
   to add them: `node .claude/hub/tasks.mjs section "<title>"` for each section, then
   `node .claude/hub/tasks.mjs add <section> "<task>"` with `--where`, `--depends <ids>`,
   `--done-when` and `--size S|M|L`. Show what you are going to add first.

Never print the token, put it in a command or copy it anywhere: only the scripts read it. A
machine's token is revoked in the hub: Manage projects → "N tokens" → Revoke.

At the end: the project and its link (`node .claude/hub/tasks.mjs url`), the files added or changed
(`.claude/hub/`, `.claude/commands/hub-init.md`, `hub.md`, `task.md`, `.claude/status-hub.json`, the
section in `CLAUDE.md`), and what next: commit them so that teammates get `/hub` and `/task`; each
teammate runs `/hub` once for a token of their own machine; `/task` takes a task.
