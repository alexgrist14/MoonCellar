# Game service

`apps/game` is the online service of the game ports: a NestJS 11 application on Bun, next to
`apps/api` and built the same way. It answers on `game.mooncellar.space` (port 3229 in the
container and in development) and keeps its data in the `game` database of the stack's MongoDB.

## Endpoints

| Method | Path                   | What it returns                                                                                                      |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health`              | `{ status, database, uptimeSeconds }` — `database` is `up` while MongoDB is connected                                |
| `GET`  | `/leaderboards/:level` | Best times of a level, fastest first: `{ level, total, entries }`, paged by `limit` (1–100, default 20) and `offset` |
| `GET`  | `/api`                 | Swagger UI and the OpenAPI document of the service                                                                   |
| `GET`  | `/metrics`             | Prometheus metrics, behind `Authorization: Bearer <METRICS_TOKEN>`                                                   |

Request and response shapes are the `Game*` schemas of `@mooncellar/schemas`
(`packages/schemas/src/game.schema.ts`).

## Running it locally

```bash
docker compose -f infra/docker-compose.yml up -d mongodb
cp apps/game/.env.example apps/game/.env
bun run dev:game
curl localhost:3229/health
```

`bun --filter game build` type-checks the service and boots it in preview mode without touching
MongoDB, as the API's build does.

## Environment

| Variable                  | Default | Purpose                                                                                      |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `MONGO_CONNECTION_STRING` | —       | The stack's MongoDB; the service uses its `game` database                                    |
| `PORT`                    | `3229`  | Listening port                                                                               |
| `LOCAL_CONNECTION`        | —       | Extra CORS origins, comma-separated, next to `https://mooncellar.space`                      |
| `LOKI_HOST`               | —       | Sends logs to Loki under the label `app=mooncellar-game`; without it logs are pretty-printed |
| `PROMETHEUS_ENABLED`      | `true`  | Default process metrics, prefixed `mooncellar_game_`                                         |
| `METRICS_TOKEN`           | —       | Bearer token of `/metrics`                                                                   |

## Deployment

The `game` path filter of `.github/workflows/ci.yml` builds `apps/game/Dockerfile` with the
`HOST_ENV_GAME` secret as its `.env` and runs it as `mooncellar-game` in the `mooncellar` network;
nginx serves it as `game.mooncellar.space`, Prometheus scrapes it as the job `mooncellar-game`.
Variables and the first-deploy checklist are in [deploy-env.md](deploy-env.md#host_env_game-contents).
