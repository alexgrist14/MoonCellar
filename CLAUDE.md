# MoonCellar-Server

## Package manager

This project uses **bun** exclusively. Using `npm` is forbidden.

- Install dependencies with `bun install` (never `npm install`).
- Add/remove packages with `bun add` / `bun remove`.
- Run scripts with `bun run <script>` (or `bunx` for one-off binaries).
- Do not create or commit `package-lock.json` — only `bun.lock`/`bun.lockb` is allowed.

## Code generation

- Do not add comments when generating or modifying code.

## Zod schemas

- The zod schema files in `MoonCellar-Server/src/shared/zod/schemas/` and
  `MoonCellar/src/lib/shared/lib/schemas/` are byte-identical copies. The server copy is
  canonical — `createZodDto` generates the NestJS DTOs from it.
- Any change to a schema must be applied to both copies in the same change, byte for byte.
- Verify with `bun run check:schemas`.
- `igdb.schema.ts` is client-only and exempt.

## Docker

- **Keep the `mongodb` service pinned to `mongo:7` — do not move it to `mongo:latest` or any
  8.x tag.** MongoDB 8.x vendors a TCMalloc that violates the kernel rseq ABI, and recent 8.x
  builds refuse to start on Linux kernels 6.19 through 7.0.13 with a fatal
  `MongoDB cannot start: Linux kernel versions 6.19 and newer has a known incompatibility`
  (log id `12257600`, container exits 1). Ubuntu 26.04 reports `7.0.0-XX` from uname whatever
  its ABI bump, so the parsed version stays 7.0.0 and every kernel upgrade still trips the
  check. There is no bypass: `GLIBC_TUNABLES=glibc.pthread.rseq=0` does not skip it and the
  binary exposes no override. `mongo:8.2` starts only because the guard was never backported
  to that branch — the crash bug is still there. See https://jira.mongodb.org/browse/SERVER-121912.

## IGDB

- `linkGameCharacters()` loads every game to reconcile both sides, so it must only write rows
  that actually changed — `isSameObjectIdList` guards each `bulkWrite` op. Without that guard a
  nightly re-run rewrites all ~376k game documents and bumps their `updatedAt`, which
  `getGameSlugs` feeds to the sitemap as `lastmod` — every game would look freshly edited
  every day.


## CodeGraph across the two repositories

- **This repo and the `MoonCellar` client have separate `.codegraph/` indexes, and a query
  resolves against the session's working directory.** Both `.mcp.json` files launch
  `codegraph serve --mcp` with no fixed path, so a session started in one repo sees only that
  repo's index.
- **Querying across repos fails silently — it does not error and does not return empty.** It
  returns plausible-looking symbols from the session's own repo instead. Asking a
  client-rooted session for `upsertCharacterFromIgdb linkGameCharacters IGDBService` (all
  server-only) came back with `characters.schema.ts`, `igdb.api.ts` and `GamePage.tsx`, and
  nothing signalled that all three requested symbols were missing.
- **Pass `projectPath` with the absolute path to the other repo** (or `cd` into it first for
  the CLI). The same query with `projectPath` pointing here returned 80 symbols across 19
  files.
- This matters constantly, because the zod schemas are mirrored across both repos and most
  schema work touches server and client together.
- The `codegraph prompt-hook` in `~/.claude/settings.json` is bound to the session's directory
  the same way, so its auto-injected context describes the session's repo — not necessarily
  the one being edited. Do not read its silence as "nothing relevant exists".
