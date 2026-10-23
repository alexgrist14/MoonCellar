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
| `plan` — Plan | `PlanBlockSchema` | Totals, tasks by section with state, owner and what a task waits for |

The menu shows each project's progress from its first block: functions done for `decomp`, tasks done
for `plan`. An upload older than a day turns the "Updated" line yellow.

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

The MoonCellar project's own plan is [`docs/plan.md`](./plan.md): the CI job `plan` parses it with
`scripts/upload-plan.ts` (`bun scripts/upload-plan.ts --check` only parses) and uploads it on every
push to `main` that changes it, with the repository secret `STATUS_HUB_TOKEN` — the token of the
`mooncellar` project. Without the secret the job checks the plan and warns. Other projects send
their blocks from their own tooling, usually right after a merge into their `main`.

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
| `PUT /projects/:slug/data/:block` | project token | Upload a block |

## Trying it locally

Chromium refuses a cookie with `Domain=.localhost`, which is what the API sets for a localhost
origin, so signing in on `status.localhost` does not stick. To click through the hub locally, run
the API against a throwaway database and the web with `NEXT_PUBLIC_API_URL` on a same-site host pair
(for example `status.mooncellar.test` and `api.mooncellar.test` mapped to 127.0.0.1), allow that
origin in `allowedDevOrigins` for the session, and put the session cookies into the browser by hand.
Never point a local API at the production database for this: `autoIndex` builds the new indexes there.
