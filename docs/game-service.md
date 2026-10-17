# Game service

`apps/game` is the online service of the game ports: a NestJS 11 application on Bun, next to
`apps/api` and built the same way. It answers on `game.mooncellar.space` (port 3229 in the
container and in development) and keeps its data in the `game` database of the stack's MongoDB.

## Endpoints

| Method | Path                                   | What it returns                                                                                                                                                                                                                                     |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health`                              | `{ status, database, uptimeSeconds }` — `database` is `up` while MongoDB is connected                                                                                                                                                               |
| `GET`  | `/leaderboards/:level`                 | Best times of a level, fastest first: `{ level, total, entries }`, paged by `limit` (1–100, default 20) and `offset`                                                                                                                                |
| `PUT`  | `/leaderboards/:level`                 | Game token. Submits `{ timeMs, ghost }` (the recorded run, base64, up to 256 KiB); the run is checked against the time (see below) and replaces the player's entry only when faster: `{ improved, entry }`; a run that does not hold up answers 422 |
| `GET`  | `/leaderboards/entries/:entryId/ghost` | The recorded run of an entry: `{ entryId, level, userId, displayName, timeMs, ghost }`; 404 when it has none                                                                                                                                        |
| `POST` | `/account/device`                      | Starts signing in: `{ deviceCode, userCode, verificationUrl, … }` ([game-sign-in.md](game-sign-in.md))                                                                                                                                              |
| `POST` | `/account/device/token`                | Polls the sign-in: `{ status: "pending" }`, then `{ status: "approved", token, account }`                                                                                                                                                           |
| `GET`  | `/account/me`                          | Game token. The account the game is signed in with: `{ id, userName, avatar }`                                                                                                                                                                      |
| `POST` | `/account/sign-out`                    | Game token. Revokes the token; the device disappears from the site's Settings → Game devices                                                                                                                                                        |
| `GET`  | `/account/friends`                     | Game token. Who the player can challenge: MoonCellar followings and followers, `[{ id, userName, avatar }]` by name                                                                                                                                 |
| `POST` | `/challenges`                          | Game token. Challenges a friend with a run: `{ toUserId, level, timeMs, comment, ghost }`, checked like a leaderboard time; 403 for someone who is not a friend, 429 after five unopened challenges to the same friend                              |
| `GET`  | `/challenges/incoming`                 | Game token. Challenges sent to the player since the last call, oldest first, without ghosts; each is handed out once                                                                                                                                |
| `GET`  | `/challenges/:challengeId`             | Game token. The challenge with its ghost, for its recipient or sender; challenges expire after 30 days                                                                                                                                              |
| `GET`  | `/api`                                 | Swagger UI and the OpenAPI document of the service                                                                                                                                                                                                  |
| `GET`  | `/metrics`                             | Prometheus metrics, behind `Authorization: Bearer <METRICS_TOKEN>`                                                                                                                                                                                  |

"Game token" means `Authorization: Bearer <token>` with the token `/account/device/token`
returned; without it, or after the device was signed out on the site, the endpoint answers 401.

Request and response shapes are the `Game*` schemas of `@mooncellar/schemas`
(`packages/schemas/src/game.schema.ts`).

## Run checks

A submitted time is only as good as the run recorded with it. `module/leaderboards/ghost.ts` reads
the game's ghost file (version 3: big-endian frame count, then per frame the milliseconds since
the previous one and the 16.16 fixed-point position) and rejects the time when:

- the file is not a complete version 3 run;
- the run, from the first step, lasts longer than the time plus 750 ms. The game starts recording
  during the camera fly-over before the countdown, while the race clock still stands, so the
  standing frames at the start are not counted; the last frame comes up to 500 ms before the
  finish;
- two frames are more than 2 s apart;
- the runner covers more than 35 m/s between two frames, unless the new spot is within 12 m of an
  earlier one — a respawn at a checkpoint;
- the runner moves for less than half of the time;
- more than a quarter of the moving time goes faster than 11 m/s. The runner tops out at about
  10 m/s: in a real run of the training level 83 % of the moving time is 9–11 m/s and 5 % is
  faster, while the same run sped up by 11 % is above 11 m/s for 80 % of the time.

Once a level has accepted runs, a new one must also start within 15 m of the start of one of the
twenty best and finish within 30 m of one of their finishes: every honest run of a level shares the
spawn point and the finish, so a run cut short or recorded elsewhere stops there. The first run of
a level has nothing to compare with and is trusted. Challenges go through the same checks.

The limits are `GHOST_LIMITS`, calibrated on real runs from the port; they know nothing about the
level itself, so a run built by hand along a plausible path, or one sped up by a few percent,
still passes. `bun --filter game test` runs the checks.

## Match signalling

`wss://game.mooncellar.space/signal` is a WebSocket where two game ports find each other before
they connect directly (plan G4 of the port). Messages are JSON text frames, shaped by
`GameSignalClientMessageSchema` and `GameSignalServerMessageSchema`:

| Client sends                        | Server answers                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `{ type: "host", port }`            | `{ type: "hosted", code }` — a four-character room code to give the other player                           |
| `{ type: "join", code, port }`      | `{ type: "joined", code, peer }` to the guest and `{ type: "peer", peer }` to the host                     |
| `{ type: "signal", data }`          | `{ type: "signal", data }` delivered to the other player (up to 4 KiB, e.g. connection candidates)         |
| `{ type: "leave" }`, or disconnects | `{ type: "left" }` to the host when the guest leaves; `{ type: "closed" }` to the guest when the host does |

`peer` is `{ name, address, port }`: the address the server saw the player connect from
(`X-Forwarded-For` behind nginx) and the port that player announced. A game token
(`Authorization: Bearer` or `?token=`) makes `name` the MoonCellar user name, otherwise it is
`Player`. A room holds two players; mistakes answer `{ type: "error", message }`. The server pings
every 30 seconds and drops a socket that misses a pong; nginx keeps an idle socket for 120 seconds.

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
| `API_URL`                 | —       | The MoonCellar API (`http://localhost:3228`); sign-in and token checks go through it         |
| `LOCAL_CONNECTION`        | —       | Extra CORS origins, comma-separated, next to `https://mooncellar.space`                      |
| `LOKI_HOST`               | —       | Sends logs to Loki under the label `app=mooncellar-game`; without it logs are pretty-printed |
| `PROMETHEUS_ENABLED`      | `true`  | Default process metrics, prefixed `mooncellar_game_`                                         |
| `METRICS_TOKEN`           | —       | Bearer token of `/metrics`                                                                   |

## Deployment

The `game` path filter of `.github/workflows/ci.yml` builds `apps/game/Dockerfile` with the
`HOST_ENV_GAME` secret as its `.env` and runs it as `mooncellar-game` in the `mooncellar` network;
nginx serves it as `game.mooncellar.space`, Prometheus scrapes it as the job `mooncellar-game`.
Variables and the first-deploy checklist are in [deploy-env.md](deploy-env.md#host_env_game-contents).
