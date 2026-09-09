# Deployment variables

Every value the CI/CD pipeline needs, and where it has to live once the two repositories
become one.

Today each repository has its own set of GitHub secrets, so both workflows can read
`secrets.HOST_ENV` and `secrets.WORK_DIR` and get different values. In a monorepo there is one
secret store for both apps: **anything that differs between the frontend and the backend must
be split by name**, or the second workflow silently deploys with the first one's values.

---

## GitHub secrets

Repository settings → Secrets and variables → Actions → *Repository secrets*.

### Shared — one value for the whole repository

| Secret | Used by | Description |
|---|---|---|
| `SSH_HOST` | both workflows | Production host the image is copied to and deployed on |
| `SSH_USER` | both workflows | SSH user; also the owner of the `systemctl --user` units |
| `SSH_PRIVATE_KEY` | both workflows | Private key for that user, no passphrase |

If the API and the site ever move to different hosts, these split the same way as everything
below (`SSH_HOST_WEB` / `SSH_HOST_API`).

### Per app — must be split

| Secret | Replaces | Description |
|---|---|---|
| `WORK_DIR_WEB` | `WORK_DIR` (frontend repo) | Directory on the host holding the frontend's `run.sh` and its systemd unit |
| `WORK_DIR_API` | `WORK_DIR` (backend repo) | Same for the backend. Keep separate even if the paths look alike today — `run.sh` is per-service |
| `HOST_ENV_WEB` | `HOST_ENV` (frontend repo) | Whole `.env` file for `apps/web`, written by the workflow before `podman build` |
| `HOST_ENV_API` | `HOST_ENV` (backend repo) | Whole `.env` file for `apps/api` |

`HOST_ENV_*` is a multi-line secret: the entire file, one `KEY=value` per line. The workflow
writes it to the app's own directory, not to the repository root:

```yaml
- name: Build images
  run: |
    if [ "$DEPLOY_WEB" = "true" ]; then
      echo "${{ secrets.HOST_ENV_WEB }}" > apps/web/.env
      podman build -f apps/web/Dockerfile -t mooncellar-frontend:latest .
    fi
```

### Where the production values actually live

**A GitHub secret cannot be read back** — not through the UI, not through the API, not by the
repository owner. The existing `HOST_ENV` of either repository is therefore not a source you
can copy from.

The production environment exists on the host, baked into the running image by the current
`COPY ./.env .env`. Lift it from there:

```bash
podman ps
podman exec <container> cat /app/.env
# or, without touching the running container:
podman run --rm --entrypoint cat mooncellar-frontend:latest /app/.env
```

After the migration those paths become `/app/apps/web/.env` and `/app/apps/api/.env`.

**Do not seed the secrets from a developer's local `.env`.** Ours mixes localhost URLs with
live credentials, and it is missing half the variables the code reads — a build from it would
ship a site calling `localhost:3228` with empty canonical links. Reconcile what you pull off
the host against the tables below, then set the secrets from that file:

```bash
gh secret set HOST_ENV_WEB  < prod-web.env
gh secret set HOST_ENV_API  < prod-api.env
gh secret set WORK_DIR_WEB  --body "/home/deploy/mooncellar-frontend"
gh secret set WORK_DIR_API  --body "/home/deploy/mooncellar-backend"
```

Managing repository secrets requires the **admin** role; write access is not enough. Check with
`gh api repos/<owner>/<repo> --jq .permissions`.

### Not secrets — these live in the workflow file

A single `.github/workflows/ci.yml` deploys both apps: a `changes` job decides which
workspaces were touched, and the deploy job builds only those, ships them in one
multi-image archive over one SSH session, and restarts only the services it rebuilt.

| Value | Frontend | Backend |
|---|---|---|
| Image name | `mooncellar-frontend` | `mooncellar-backend` |
| systemd unit | `Mooncellar-Frontend.service` | `Mooncellar-Backend.service` |
| Dockerfile | `apps/web/Dockerfile` | `apps/api/Dockerfile` |
| Exposed port | `3111` | `3228` |
| Path filter | `apps/web/**`, `packages/**` | `apps/api/**`, `packages/**` |
| Deploy flag in the SSH script | `DEPLOY_WEB` | `DEPLOY_API` |

---

## What production sets today

Verified against the running containers. The host ships far fewer keys than the tables below
list, because almost every variable the code reads has a hardcoded fallback — and in this
deployment those fallbacks happen to be the production values.

**Frontend — three keys set:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_LOKI_HOST`,
`NEXT_PUBLIC_S3_HOST`.

**Backend — fifteen keys set:** everything in its table except `FRONT_URL`, `LOCAL_CONNECTION`
and `INDEXNOW_KEY`.

| Unset in production | Falls back to | Verdict |
|---|---|---|
| `INTERNAL_API_URL` | `http://host.containers.internal:3228` | Correct for this host — the podman gateway |
| `NEXT_PUBLIC_FRONT_URL` | `https://mooncellar.space` | Correct; canonical links and the sitemap are fine |
| `LOKI_HOST` (web) | `http://host.containers.internal:3100` | Correct |
| `GEO_BLOCK_COUNTRIES` | `RU` | Country blocking is on in production through this default alone |
| `NEXT_PUBLIC_FARO_APP_NAME` | `mooncellar-frontend` | Correct |
| `NEXT_PUBLIC_APP_VERSION` | `0.0.0` | Every Faro event reports 0.0.0, so telemetry cannot be filtered by release |
| `NEXT_PUBLIC_CORS_SERVER` | **nothing** | See below |
| `FRONT_URL` (api) | `https://mooncellar.space` | Correct |
| `INDEXNOW_KEY` | a key hardcoded in `apps/api/src/shared/constants.ts` | Works; an IndexNow key is public by design, since the host must serve it at `/<key>.txt` |

Two keys are set in production but referenced nowhere in the code — `NEXT_PUBLIC_LOKI_HOST` and
`NEXT_PUBLIC_S3_HOST`. They can be dropped from `HOST_ENV_WEB`.

> **`NEXT_PUBLIC_CORS_SERVER` has no fallback and is not set.**
> `visitors.utils.ts` builds its request as `` `${process.env.NEXT_PUBLIC_CORS_SERVER}api?` ``,
> so in production that URL starts with the literal string `undefined` and the visitor counter
> request fails. This predates the monorepo; fixing it means adding the key to `HOST_ENV_WEB`,
> not changing the migration.

## `HOST_ENV_WEB` — contents

> **`NEXT_PUBLIC_*` values are inlined into the bundle at build time.** The workflow writes the
> `.env` before `podman build`, so a change here needs a rebuild and redeploy — restarting the
> systemd unit picks up nothing.

| Variable | Secret | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | no | Public API URL used from the browser — `https://api.mooncellar.space` in production, `http://localhost:3228` in dev |
| `INTERNAL_API_URL` | no | API URL used from server components and route handlers. On the same host this is the container-internal address, which is why it is separate from the public one |
| `NEXT_PUBLIC_FRONT_URL` | no | Public URL of the site. Canonical links, sitemap and Open Graph URLs are built from it — a wrong value here is an SEO incident, not a cosmetic bug |
| `NEXT_PUBLIC_CORS_SERVER` | no | Origin sent as the CORS credentials target; must match the API's `FRONT_URL` |
| `NEXT_PUBLIC_APP_VERSION` | no | Version tag attached to every Faro event, so telemetry can be filtered by release |
| `NEXT_PUBLIC_FARO_APP_NAME` | no | Application name in Grafana Faro |
| `LOKI_HOST` | no | Loki push endpoint for the `/api/logs` route handler. Server-side only — it must not become `NEXT_PUBLIC_*`, or the endpoint ends up in the browser bundle. Defaults to `http://host.containers.internal:3100` when unset (`apps/web/src/app/api/logs/route.ts`) |
| `GEO_BLOCK_COUNTRIES` | no | Comma-separated ISO country codes to block, e.g. `RU,BY`. Empty disables blocking |

Nothing in this file is a credential — everything the frontend needs is public by design. It
still belongs in a secret, because the file also pins the internal API address.

---

## `HOST_ENV_API` — contents

| Variable | Secret | Description |
|---|---|---|
| `MONGO_CONNECTION_STRING` | **yes** | Full MongoDB URI including credentials, database `games` |
| `JWT_SECRET` | **yes** | Signing key for access and refresh tokens. Rotating it logs every user out |
| `JWT_EXPIRE` | no | Access token lifetime, e.g. `15m` — consumed via `ConfigService` in `auth.module.ts` |
| `FRONT_URL` | no | Public frontend URL. Drives CORS and links in generated content; must match the frontend's `NEXT_PUBLIC_FRONT_URL` |
| `LOCAL_CONNECTION` | no | Extra comma-separated origins allowed by CORS. Development convenience — leave empty in production |
| `TWITCH_CLIENT_ID` | no | IGDB authenticates through Twitch; this is the app id |
| `TWITCH_CLIENT_SECRET` | **yes** | Twitch app secret for the IGDB sync job |
| `RETROACHIEVEMENTS_API_KEY` | **yes** | RetroAchievements API key |
| `S3_ID` | **yes** | S3 access key id for user uploads |
| `S3_KEY` | **yes** | S3 secret access key |
| `S3_HOST` | no | S3 endpoint used for writes |
| `S3_HOST_CDN` | no | Public CDN host the stored URLs are built from. Must be listed in the frontend's `next.config.mjs` `images.remotePatterns`, otherwise avatars fail to render |
| `S3_REGION` | no | S3 region |
| `LOKI_HOST` | no | Loki endpoint for `pino-loki` |
| `FARO_COLLECTOR_URL` | no | Grafana Alloy endpoint the `faro` module forwards browser telemetry to |
| `PROMETHEUS_ENABLED` | no | `true` / `false` — switches the `/metrics` endpoint off entirely |
| `METRICS_TOKEN` | **yes** | Bearer token guarding `/metrics`. Prometheus must be configured with the same value |
| `INDEXNOW_KEY` | **yes** | IndexNow key used to submit new game pages to search engines |

---

## Not part of deployment

These exist locally but must never end up in `HOST_ENV_*`:

| Variable | Where it belongs |
|---|---|
| `API_BASE_URL`, `SEARXNG_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The `game-adder` MCP server — a local development tool. `ADMIN_PASSWORD` is a real account password; keep it out of any shared secret |
| `CHROME_PATH`, `CHECK_BASE_URL` | `bun --filter web check:layout`, run on a developer machine |
| `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` | `infra/docker-compose.yml`, local MongoDB only |

## Dead variables — drop them during the migration

Present in the current `.env` files, referenced nowhere in the code:

| Variable | Why it is dead |
|---|---|
| `GEOIP_DB_PATH` | The database path is hardcoded as `/app/geo/GeoLite2-Country.mmdb` in `geo.utils.ts`, matching the `ADD` in the Dockerfile |
| `NEXT_PUBLIC_S3_HOST` | No reference in `apps/web/src` — image hosts come from `next.config.mjs` |
| `NEXT_PUBLIC_LOKI_HOST` | No reference either; the route handler uses the server-side `LOKI_HOST` |
| `MOONCELLAR_CLIENT_PATH` | Only used by `check-schema-parity.ts`, which is deleted together with the duplicated schemas |

---

## Checklist before the first monorepo deploy

1. `HOST_ENV_WEB`, `HOST_ENV_API`, `WORK_DIR_WEB`, `WORK_DIR_API` created; the old `HOST_ENV`
   and `WORK_DIR` deleted so a workflow cannot silently fall back to them.
2. The workflow references the new names — grep the yml for `HOST_ENV` and `WORK_DIR` without
   a suffix and expect no hits.
3. `git check-ignore -v apps/web/.env apps/api/.env` reports a match for both. The merged root
   `.gitignore` must keep the pattern as `.env`, not `/.env`: with a leading slash it only
   matches the repository root, and `apps/api/.env` — `JWT_SECRET`, `S3_KEY`,
   `TWITCH_CLIENT_SECRET` — becomes committable.
4. `FRONT_URL` (api) and `NEXT_PUBLIC_FRONT_URL` (web) point at the same origin, as do
   `NEXT_PUBLIC_CORS_SERVER` and the API's CORS configuration.
5. The first run after the migration touches root files, so the `changes` job marks both
   apps as changed and both are rebuilt and restarted in one pass. Watch that run: a failure
   in either image build stops the deploy before anything is copied, so the host keeps
   running the previous versions of both.

---

## `.env.example`

`apps/web/.env.example` and `apps/api/.env.example` are committed with keys only and no
values; the real `.env` files stay untracked. The blocks below mirror them.

<details>
<summary><code>apps/web/.env.example</code></summary>

```dotenv
# Public API URL used from the browser
NEXT_PUBLIC_API_URL=http://localhost:3228
# API URL used from server components and route handlers
INTERNAL_API_URL=http://localhost:3228
# Public URL of this app — canonical links, sitemap, Open Graph
NEXT_PUBLIC_FRONT_URL=http://localhost:3000
# Origin sent as the CORS credentials target
NEXT_PUBLIC_CORS_SERVER=http://localhost:3000
# Release tag attached to Faro telemetry
NEXT_PUBLIC_APP_VERSION=dev
# Application name in Grafana Faro
NEXT_PUBLIC_FARO_APP_NAME=mooncellar-web
# Loki push endpoint for the /api/logs handler (server-side only)
LOKI_HOST=http://localhost:3100
# Comma-separated ISO country codes to block; empty disables it
GEO_BLOCK_COUNTRIES=
```

</details>

<details>
<summary><code>apps/api/.env.example</code></summary>

```dotenv
# MongoDB URI including credentials, database `games`
MONGO_CONNECTION_STRING=mongodb://admin:admin@localhost:27017/games?authSource=admin
# Signing key for access and refresh tokens
JWT_SECRET=
# Access token lifetime
JWT_EXPIRE=15m
# Public frontend URL — CORS and generated links
FRONT_URL=http://localhost:3000
# Extra comma-separated CORS origins for local development
LOCAL_CONNECTION=http://localhost:3000

# IGDB authenticates through Twitch
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

RETROACHIEVEMENTS_API_KEY=

# S3 storage for user uploads
S3_ID=
S3_KEY=
S3_HOST=
S3_HOST_CDN=
S3_REGION=

# Observability
LOKI_HOST=http://localhost:3100
FARO_COLLECTOR_URL=http://localhost:12347
PROMETHEUS_ENABLED=false
METRICS_TOKEN=

# IndexNow submission key
INDEXNOW_KEY=

# game-adder MCP server — local tooling, never part of HOST_ENV_API
API_BASE_URL=http://localhost:3228
SEARXNG_URL=http://localhost:8891
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

</details>
