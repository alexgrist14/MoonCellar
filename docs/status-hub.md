# Status hub

`status.mooncellar.space` is where MoonCellar admins follow the team's projects: a plan of tasks, the
progress of a decompilation, or both. Each project uploads its own data; the hub only shows it.

## Who gets in

- Sign-in is the site's own account, on the hub's page (`/login`, the shared `AuthModal` with
  `isPage`). The session cookies are the site's — `Domain=mooncellar.space` covers the subdomain —
  so someone signed in on `mooncellar.space` is signed in here too.
- Only the `admin` role sees anything: the hub asks `GET /admin/access` on every server render.
  Anyone else gets "No access"; a missing or expired session goes to `/login?next=<page>`.
- Add or remove an admin as everywhere else, in the site's admin Users list.

## Pages

| Path | What it shows |
| --- | --- |
| `/login` | Sign in |
| `/` | Opens the first project, or "No projects yet" |
| `/<project>` and `/<project>/<block>` | The project with a tab per block |
| `/manage` | Add a project, change its blocks, manage its tokens, delete |
| `/connect` | Allow a connect command to get a token |

They live in `apps/web` (`src/app/status`, the pages `Status*` and `widgets/status`) and are answered
only for a host starting with `status.`; on `mooncellar.space` the same routes are a 404. How the
host reaches them is in the Status hub section of `apps/web/CLAUDE.md`.

## Projects and blocks

A project has a name, an address (`slug`: lowercase letters, digits and dashes; `login`, `manage`,
`status`, `api`, `images`, `img` and `connect` are taken by the hub) and one or more blocks. A block is a type the hub
knows how to draw; a new project is data, a new block type is code.

| Block | Schema (`@mooncellar/schemas`) | Shows |
| --- | --- | --- |
| `decomp` — Decompilation | `DecompBlockSchema` | Totals, categories, areas, a map with one cell per function, files, feed |
| `plan` — Plan | `PlanBlockSchema` | Totals, tasks by section with state, owner and what a task waits for; editable |

The menu shows each project's progress from its first block: functions done for `decomp`, tasks done
for `plan`. An upload older than a day turns the "Updated" line yellow.

## The plan lives in the hub

A Decompilation block is uploaded by its project. A Plan is not: it is stored in the hub
(`projectplans`, one document per project) and changed there, by people on the site and by tools
through the API. Nobody keeps it in a file any more; a project with a markdown plan imports it once.

- **On the site** a task's "⋯" menu and its panel (click the row) take it (for yourself or "Assign
  to…" someone), release it, mark it done or reopen it, edit it and delete it; every section adds tasks,
  renames itself and, when empty, deletes itself; "Section" adds one. Admins on the site may override
  anyone (take a task someone else holds, finish it for them).
- **State** is derived, never stored: done; taken (has an owner); waiting (a task it depends on is not
  done); free. A task id is its section's letter and the next number (`H6`); a new section takes the
  first free letter unless one is given.
- **Every change is logged** (`projectplanevents`: who, what, when) and shown as the task's history.
- **Tools act with a project token and say for whom**: `"as": "<name>"` in the body of take, release,
  done and reopen. With a token, taking a task someone else holds, releasing it or finishing it answers
  409 unless `"force": true`; deleting is for admins on the site only.
- **Import**: a plan arrives once, into an empty hub plan — `PUT /projects/:slug/plan`, or the older
  `PUT /projects/:slug/data/plan` — with done tasks' `doneAt` when known. After that both answer 409.
  `bun scripts/import-plan.ts [--file plan.md]` parses a markdown plan in the format of
  [`plan.md`](./plan.md) and imports it with `STATUS_HUB_TOKEN`.

## Uploading

A project uploads with a token of its own; a project has one token per machine or CI, named after it,
and any of them can be revoked in **Manage projects → Tokens** without touching the others. The API
keeps only their sha256 and records when each one last uploaded.

The way to get a token is to connect from where the project uploads, with nothing to copy:

```sh
bun scripts/hub-connect.ts <project>                       # saves ~/.config/mooncellar/<project>-hub-token
bun scripts/hub-connect.ts <project> --secret STATUS_HUB_TOKEN --repo <owner/repo>   # a CI secret
```

The command waits on `127.0.0.1`, opens `status.mooncellar.space/connect`, and after an admin presses
**Allow** receives a one-time code (ten minutes), exchanges it for a new token named after the machine
(`user@host`, or `CI` for a secret) and stores it. A project may ship its own connect command that does
the same (`POST /projects/:slug/tokens/exchange`). "Add token" in Manage projects issues one by hand
and shows it once.

A project then sends each block on its own:

```sh
gzip -c plan.json | curl -X PUT https://api.mooncellar.space/projects/<project>/data/plan \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Content-Encoding: gzip" --data-binary @-
```

- The body is validated against the block's schema; a failure answers 400 naming the fields, and
  nothing is stored. The answer of a success is the upload (`updatedAt`, `size`, `done`, `total`).
- A block replaces the previous one whole. Send gzip: the API reads at most 2 MB of JSON, nginx
  passes 1 MB of body.
- A wrong token, a project that does not exist and a missing header all answer 401 with the same
  message, so the endpoint does not tell which projects exist.

Projects send their Decompilation blocks from their own tooling, usually right after a merge into
their `main`. The MoonCellar project's plan started as [`docs/plan.md`](./plan.md) and lives in the hub
once imported.

## API

| Method and path | Who | What |
| --- | --- | --- |
| `GET /projects` | admin | Every project with its uploads |
| `POST /projects` | admin | Create (no tokens yet) |
| `GET /projects/:slug` | admin | One project |
| `PATCH /projects/:slug` | admin | Rename, change blocks (a dropped block loses its upload) |
| `DELETE /projects/:slug` | admin | Delete with everything uploaded |
| `POST /projects/:slug/tokens` | admin | Add a named token; the answer carries it once |
| `DELETE /projects/:slug/tokens/:id` | admin | Revoke one token |
| `POST /projects/:slug/connect` | admin | A one-time code for a connect command |
| `POST /projects/:slug/tokens/exchange` | anyone with a code | Exchange the code for a token |
| `GET /projects/:slug/data/:block` | admin | The block as uploaded |
| `GET /projects/:slug/plan` | admin or token | The plan with every task's state |
| `PUT /projects/:slug/plan` | admin or token | Import a whole plan into an empty one |
| `POST /projects/:slug/plan/sections` | admin or token | Add a section |
| `PATCH`, `DELETE /projects/:slug/plan/sections/:id` | admin or token; delete — admin | Rename; delete an empty section |
| `POST /projects/:slug/plan/tasks` | admin or token | Add a task |
| `PATCH`, `DELETE /projects/:slug/plan/tasks/:id` | admin or token; delete — admin | Edit; delete |
| `POST /projects/:slug/plan/tasks/:id/<take, release, done, reopen>` | admin or token | Change the state (`as`, `note`, `force`) |
| `GET /projects/:slug/plan/events?task=<id>` | admin or token | Recent changes, of the plan or of one task |
| `PUT /projects/:slug/data/:block` | project token | Upload a block |

## Trying it locally

Chromium refuses a cookie with `Domain=.localhost`, which is what the API sets for a localhost
origin, so signing in on `status.localhost` does not stick. To click through the hub locally, run
the API against a throwaway database and the web with `NEXT_PUBLIC_API_URL` on a same-site host pair
(for example `status.mooncellar.test` and `api.mooncellar.test` mapped to 127.0.0.1), allow that
origin in `allowedDevOrigins` for the session, and put the session cookies into the browser by hand.
Never point a local API at the production database for this: `autoIndex` builds the new indexes there.
