# Hub connector

Connects a repository to a project of the MoonCellar status hub (https://status.mooncellar.space)
for Claude Code. It comes from the hub, Manage projects → Hub connector, as `hub-connector.zip`:
unpack it at the root of the repository.

- `/hub-init` (`.claude/commands/hub-init.md`) sets the repository up once: creates the project in
  the hub or joins an existing one, connects the machine, records the project in
  `.claude/status-hub.json` and writes `/hub`, `/task` and a section on the plan in `CLAUDE.md` from
  `templates/`.
- `/hub` connects a machine (its own token, saved to `~/.config/mooncellar/<project>-hub-token`);
  `/task` takes a task of the plan and does it.
- `node .claude/hub/tasks.mjs` reads and changes the plan from a terminal (no arguments — the list
  of commands); `node .claude/hub/hub-connect.mjs` connects a machine or a CI secret.

Needs Node.js 18 or newer, or Bun. To update, unpack a fresh archive over the repository root: it
replaces `.claude/hub/` and `/hub-init` only. The `.mjs` files are built from MoonCellar's
`scripts/` by `scripts/build-hub-connector.ts`; do not edit them.
