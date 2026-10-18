# Game service

`apps/game` is the online service of the game ports: a NestJS 11 application on Bun, next to
`apps/api` and built the same way. It answers on `game.mooncellar.space` (port 3229 in the
container and in development) and keeps its data in the `game` database of the stack's MongoDB.

It is not tied to one game. Sign-in, friends and match signalling are shared by every port;
leaderboards and challenges live under `/games/:game/…`, where `:game` is a slug registered in
`src/games/games.ts` (see "Adding a game"). The first registered game is `rooftops`, the
port of a rooftop-running game from the decompilation project.

## Endpoints

| Method | Path                                                | What it returns                                                                                                                                                                                                                                                                      |
| ------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/health`                                           | `{ status, database, uptimeSeconds }` — `database` is `up` while MongoDB is connected                                                                                                                                                                                                |
| `POST` | `/account/device`                                   | Starts signing in: `{ deviceCode, userCode, verificationUrl, … }` ([game-sign-in.md](game-sign-in.md))                                                                                                                                                                               |
| `POST` | `/account/device/token`                             | Polls the sign-in: `{ status: "pending" }`, then `{ status: "approved", token, account }`                                                                                                                                                                                            |
| `GET`  | `/account/me`                                       | Game token. The account the game is signed in with: `{ id, userName, avatar }`                                                                                                                                                                                                       |
| `GET`  | `/account/friends`                                  | Game token. MoonCellar followings and followers, `[{ id, userName, avatar }]` by name                                                                                                                                                                                                |
| `POST` | `/account/sign-out`                                 | Game token. Revokes the token; the device disappears from the site's Settings → Game devices                                                                                                                                                                                         |
| `GET`  | `/games`                                            | The registered games: `[{ slug, name, scoreOrder, scoreUnit, replayRequired }]`                                                                                                                                                                                                      |
| `GET`  | `/games/:game/leaderboards/:board`                  | A leaderboard, best score first (`scoreOrder` of the game): `{ game, board, total, entries }`, paged by `limit` (1–100, default 20) and `offset`; 404 for an unknown game or a board the game does not have                                                                          |
| `PUT`  | `/games/:game/leaderboards/:board`                  | Game token. Submits `{ score, replay? }` (replay — the game's own recording, base64, up to 256 KiB); the game's replay check runs (see "Replay checks"), and the player's entry is replaced only by a better score: `{ improved, entry }`; a score that does not hold up answers 422 |
| `GET`  | `/games/:game/leaderboards/entries/:entryId/replay` | The replay of an entry: `{ entryId, game, board, userId, displayName, score, replay }`; 404 when it has none                                                                                                                                                                         |
| `POST` | `/games/:game/challenges`                           | Game token. Challenges a friend: `{ toUserId, board, score, comment, replay? }`, checked like a leaderboard score; 403 for someone who is not a friend, 429 after five unopened challenges to the same friend                                                                        |
| `GET`  | `/games/:game/challenges/incoming`                  | Game token. Challenges of this game sent to the player since the last call, oldest first, without replays; each is handed out once                                                                                                                                                   |
| `GET`  | `/games/:game/challenges/:challengeId`              | Game token. The challenge with its replay (or `null`), for its recipient or sender; challenges expire after 30 days                                                                                                                                                                  |
| `GET`  | `/games/:game/levels`                               | Player levels, `{ game, total, levels }`: `sort` `new` (default) or `best` (rating, then number of ratings), `q` — part of the name or author, `limit` (1–50, default 20), `offset`; hidden levels are left out |
| `GET`  | `/games/:game/levels/:levelId`                      | A player level: `{ id, name, description, base, authorId, authorName, version, board, size, rating, ratings, downloads, createdAt, updatedAt }`; 404 when hidden                                                                                                                      |
| `GET`  | `/games/:game/levels/:levelId/file`                 | The level's map `{ id, version, data }` (base64); counts a download                                                                                                                                                                                                                  |
| `POST` | `/games/:game/levels`                               | Game token. Uploads `{ name, description, base, data }`; the game's level check runs (see "Player levels"); 409 at 50 levels of one author                                                                                                                                          |
| `PUT`  | `/games/:game/levels/:levelId`                      | Game token, the author only. A new version of the level: `version` grows, and with it the level's leaderboard `board`                                                                                                                                                                |
| `DELETE` | `/games/:game/levels/:levelId`                    | Game token, the author only. Deletes the level                                                                                                                                                                                                                                       |
| `PUT`  | `/games/:game/levels/:levelId/rating`               | Game token. `{ stars }` 1–5, replacing the player's earlier rating; not for one's own level                                                                                                                                                                                          |
| `POST` | `/games/:game/levels/:levelId/report`               | Game token. `{ reason }`; three players reporting a level hide it: `{ reported, hidden }`                                                                                                                                                                                            |
| `GET`  | `/games/:game/levels/reported`                      | `MODERATION_TOKEN`. Reported and hidden levels with their reports                                                                                                                                                                                                                    |
| `PUT`  | `/games/:game/levels/:levelId/moderation`           | `MODERATION_TOKEN`. `{ hidden }`; showing a level again clears its reports                                                                                                                                                                                                           |
| `GET`  | `/games/:game/storage/:bucket`                      | Game token. The player's files in a storage bucket of the game, without data: `{ game, bucket, revision, usedBytes, maxBytes, maxFileBytes, maxFiles, files: [{ path, size, sha256, updatedAt }] }`; 404 for a bucket the game does not have (see "Cloud storage") |
| `GET`  | `/games/:game/storage/:bucket/file?path=`           | Game token. The file as raw bytes (`application/octet-stream`), with `X-Content-SHA256` and `Last-Modified` |
| `PUT`  | `/games/:game/storage/:bucket/file?path=&revision=` | Game token. Writes the file from a raw `application/octet-stream` body (up to 8 MiB): `{ revision, usedBytes, file }`; with `revision`, 409 unless the bucket is still at it; 422 past the bucket's limits |
| `DELETE` | `/games/:game/storage/:bucket/file?path=&revision=` | Game token. Deletes the file: `{ revision, usedBytes, file: null }` |
| `GET`  | `/api`                                              | Swagger UI and the OpenAPI document of the service                                                                                                                                                                                                                                   |
| `GET`  | `/metrics`                                          | Prometheus metrics, behind `Authorization: Bearer <METRICS_TOKEN>`                                                                                                                                                                                                                   |

Request and response shapes are the `Game*` schemas of `@mooncellar/schemas`
(`packages/schemas/src/game.schema.ts`).

## Replay checks

A score is only as good as the replay recorded with it, so every game may bring a check
(`IGameDefinition.replay.check`): it gets the submitted replay, the score and the replays of the
board's twenty best entries, and returns a reason to reject or `null`. Challenges go through the
same check. The service itself never reads a replay; a game without a check stores it as is.

`rooftops` (`src/games/rooftops/ghost.ts`) reads its ghost file (version 3: big-endian frame
count, then per frame the milliseconds since the previous one and the 16.16 fixed-point
position) and rejects the time when:

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
  faster, while the same run sped up by 11 % is above 11 m/s for 80 % of the time;
- the board already has accepted runs and this one does not start within 15 m of the start, or
  finish within 30 m of the finish, of one of them. Every honest run of a level shares the spawn
  point and the finish, so a run cut short or recorded elsewhere stops there; the first run of a
  board is trusted.

The limits are `GHOST_LIMITS`, calibrated on real runs from the port; they use only the replays,
never level data, so a run built by hand along a plausible path, or one sped up by a few percent,
still passes. `bun --filter game test` runs the checks.

## Player levels

A game that takes levels made by its players has `levels` in its definition: `maxBytes` and an
optional `check` that gets the map file and returns a reason it would not load, or `null`. The
service stores the file as it is (`select: false`, read only by `…/file`) and never reads it
otherwise. A level's leaderboard is the board `u<levelId>v<version>` (`levelBoard`), so the
game's `board` pattern must accept it; a new version starts an empty board.

`rooftops` (`src/games/rooftops/level.ts`) takes levels of the port's map format up to 128 KiB and
walks the structure the way the game's loader reads it, checking every index the loader follows,
so a level that passes cannot crash the game. It knows only the layout of the format and the
lengths of the game's lookup tables. A player level holds the player's layout and numbers of
pieces from the game's own data; levels copied from the game's chapters are not uploaded — the
port allows it only for levels made from scratch.

Reports hide a level after three different players; a moderator sees them at
`/games/:game/levels/reported` and hides or shows a level with `…/moderation`, both behind
`MODERATION_TOKEN`. Ratings are 1–5 stars, one per player; `rating` is their average.

## Cloud storage

A game that keeps files in the player's account has `storage` in its definition: buckets by name,
each with `maxFileBytes`, `maxFiles` and `maxBytes`. The service stores a file as it is
(`storage_files`, one document per file, `data` with `select: false`) under the player's id, and
never reads it. A bucket's `revision` (`storage_buckets`) grows with every write and delete, so
a game can tell whether anything changed since it last looked, and can make a write conditional
with `revision`. Paths are up to four segments of `[A-Za-z0-9._-]`, never `.` or `..`.

Files travel as raw bytes, not base64 in JSON: `main.ts` takes `application/octet-stream`
bodies up to `GAME_STORAGE_MAX_FILE_BYTES` (8 MiB) and keeps JSON at 512 KiB.

`rooftops` has two buckets: `save` — the game's progress, the files of the port's `Documents`
folder (1 MiB each, 64 files, 4 MiB), and `skins` — the player's custom heroine models,
`<skin>/<file>` (8 MiB each, 256 files, 64 MiB). The port syncs them on sign-in in its
launcher and after a session, so a player can go on from another computer.

## Adding a game

1. Pick a slug (`[a-z][a-z0-9-]`, up to 32 characters) and add `src/games/<slug>/<slug>.game.ts`
   with an `IGameDefinition`: `name`, `scoreOrder` (`asc` when lower is better, as with times),
   `scoreUnit` (`ms` or `points`), `board` — a regular expression of the board ids the game
   uses — and `replay` (`required`, `maxBytes`, an optional `check`).
2. Register it in `GAMES` in `src/games/games.ts`. Nothing else changes: the routes, the
   collections and the challenges take the slug from the URL.
3. Files the game keeps in the player's account go in `storage` (see "Cloud storage"); a
   bucket name is `[a-z][a-z0-9-]`, up to 32 characters.
4. A replay check reads only the replays and the score. Game data (levels, assets) belongs to
   the game's publisher and never enters this repository.

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
| `MODERATION_TOKEN`        | —       | Bearer token of the player-level moderation endpoints; without it nobody moderates           |

## Deployment

The `game` path filter of `.github/workflows/ci.yml` builds `apps/game/Dockerfile` with the
`HOST_ENV_GAME` secret as its `.env` and runs it as `mooncellar-game` in the `mooncellar` network;
nginx serves it as `game.mooncellar.space`, Prometheus scrapes it as the job `mooncellar-game`.
Variables and the first-deploy checklist are in [deploy-env.md](deploy-env.md#host_env_game-contents).
