---
description: Connect this machine to the status hub (its own token) and open {{the project's name}} there
argument-hint: "[machine name]"
---

The status hub (https://status.mooncellar.space, MoonCellar admins only) is where the plan of
{{the project's name}} lives: sections and tasks that people take and finish on the site and agents
through `/task`. To read and change the plan from here, this machine needs its own token for the
project named in `.claude/status-hub.json`. Token name: $ARGUMENTS (empty — `<user>@<host>`).

1. Check: `{{node or bun}} .claude/hub/tasks.mjs list --free`. If it runs without an error (there
   may be no free tasks), the machine is connected: give the link
   (`{{node or bun}} .claude/hub/tasks.mjs url`), say briefly how many tasks are free, and stop —
   unless the user asked to connect again, for example after a token was revoked. "No hub token" or
   a 401 — go to step 2.
2. Connect: run `{{node or bun}} .claude/hub/hub-connect.mjs` (with a name — `--name "<name>"`) so
   that it keeps waiting while you answer (in Claude Code — Bash with `run_in_background`). It
   prints a link and opens it in the browser. Tell the user to sign in with a MoonCellar admin
   account and press "Allow" (not an admin — a hub admin has to open the link). The command waits up
   to ten minutes and saves the token to `~/.config/mooncellar/<project>-hub-token` by itself.
3. Wait for the command to finish. "Connected" — check
   `{{node or bun}} .claude/hub/tasks.mjs list --free` and give the link. "Not connected" or ten
   minutes passed — say what the command answered and offer to run `/hub` again.

Never print the token, pass it in a command or copy it anywhere: only the scripts read it. A
machine's token is revoked in the hub: Manage projects → "N tokens" → Revoke.

At the end: whether the machine is connected, the link to the project, and what next — `/task`.
