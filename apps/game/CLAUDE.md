# MoonCellar Game API (apps/game)

Online service of the game ports: leaderboards now, accounts, challenges and match signalling
later. Repository-wide rules live in the root [`CLAUDE.md`](../../CLAUDE.md); what the service
does and how to run it is in [`docs/game-service.md`](../../docs/game-service.md).

## Runtime

- **The service follows the runtime rules of `apps/api`** ([`apps/api/CLAUDE.md`](../api/CLAUDE.md),
  "Runtime"): Bun runs `src/main.ts` directly, `build` is `typecheck` plus `check:boot`, types
  named in decorator metadata are imported with `import type`, and scripts that import decorated
  code run with `apps/game` as the working directory. Never start it with Node.
- **It listens on `PORT` (3229 by default), never on the API's 3228**, so both run side by side in
  development and in the compose network.
- **Its data lives in the `game` database of the stack's MongoDB** (`dbName` in `app.module.ts`),
  never in the API's `games` database: the connection string is the same, the database is not.

## Contracts

- **Every request and response shape is a Zod schema in `packages/schemas/src/game.schema.ts`**,
  wrapped with `createZodDto` in `src/shared/zod/dto/game.dto.ts`. The OpenAPI document at `/api`
  is generated from them; a shape written only as a TypeScript type never reaches it.
- **Errors are `{ statusCode, message }` with an English sentence**, as in `apps/api`
  ("Errors"); `ErrorResponseFilter` is the API's filter without the axios branch.

## Accounts

- **The service never verifies a game token itself: `AccountService` asks the API**
  (`POST /auth/game/token/introspect`, [`docs/game-sign-in.md`](../../docs/game-sign-in.md)) and
  keeps the answer for 30 seconds. It holds no JWT key, and a device signed out on the site loses
  access within that window.
- **`/account/*` proxies the API's device sign-in**, so a game talks to one host only.
- **An endpoint that acts for a player uses `GameTokenGuard`**, which puts the account on
  `request.account`; the player's name is taken from it, never from the request body.

## Signalling

- **`/signal` is a plain `ws` server on the HTTP server's `upgrade` event, not a Nest gateway or
  socket.io**: the game ports speak raw WebSocket frames through libcurl. `SignalGateway` attaches
  it at bootstrap and destroys any other upgrade request. Rooms live in memory
  (`SignalService`), so the service must stay a single instance while it holds them.
- **Every client message goes through `GameSignalClientMessageSchema.safeParse`**; a bad one
  answers `{ type: "error" }` and never closes the socket.
- **nginx needs its own `location = /signal` with the upgrade headers** for `game.mooncellar.space`;
  the plain `location /` sends `Connection: ""` and the handshake fails.

## Leaderboards

- **A time is recorded only with a run that holds up** (`ghost.ts`, `docs/game-service.md`,
  "Run checks"). The checks use only the ghost file itself — never level geometry or other game
  data, which belong to the game's publisher and must not enter this repository. Change
  `GHOST_LIMITS` only together with `ghost.spec.ts`, and against real runs from the port.
- **A submitted time replaces the entry only when it is faster**, together with its ghost; a
  slower one answers `improved: false` and refreshes only the display name.
- **The ghost is stored with `select: false`** and read only by
  `GET /leaderboards/entries/:entryId/ghost`, so a leaderboard page never carries the runs.
  `main.ts` raises the JSON body limit to 512 KiB for it; the schema caps the run at 256 KiB.
- **One entry per user and level** (unique index `{ level, userId }`). Ranking sorts by `timeMs`,
  then by `updatedAt`, so an earlier equal time ranks first.
