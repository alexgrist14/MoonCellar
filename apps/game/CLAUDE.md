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

## Leaderboards

- **One entry per user and level** (unique index `{ level, userId }`). Ranking sorts by `timeMs`,
  then by `updatedAt`, so an earlier equal time ranks first.
