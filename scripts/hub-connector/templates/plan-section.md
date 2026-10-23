## Plan

- **The plan of this project lives in the MoonCellar status hub
  ({{the link from `node .claude/hub/tasks.mjs url`}}), not in the repository: read it from there
  every time — `{{node or bun}} .claude/hub/tasks.mjs list`, or `/task` — never from memory or a
  file.** People take and finish tasks on the site, agents with `/task`; a task found on the way
  goes in with `{{node or bun}} .claude/hub/tasks.mjs add <section> "<task>"`.
- **Each machine connects once with `/hub`** and gets a token of its own (Manage projects → Tokens
  in the hub revokes it). Never print the token or copy it anywhere: only the scripts read it.
- **`.claude/hub/` is the hub connector, downloaded from the hub (Manage projects → Hub connector):
  never edit its files.** To update it, unpack a fresh `hub-connector.zip` over the repository root;
  it replaces `.claude/hub/` and `/hub-init` and leaves `/hub`, `/task` and
  `.claude/status-hub.json` alone.
