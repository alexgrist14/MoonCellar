# MoonCellar API (apps/api)

Rules that apply to the NestJS service. Repository-wide rules live in the root
[`CLAUDE.md`](../../CLAUDE.md).

## Runtime

- **Bun runs the TypeScript source directly — `start`, `start:dev` (`bun --watch`) and the
  container all execute `src/main.ts`.** Bun strips types without checking them, so `build`
  runs `typecheck` and `check:boot` instead of compiling. The container image runs `build`,
  so either failure stops the deploy there.
- **`tsconfig.build.json` type-checks with Bun's semantics (`module: preserve`,
  `verbatimModuleSyntax`); do not relax it.** It is the only thing that catches two boot
  failures before they ship:
  - A type imported without `import type` and named in decorator metadata — a decorated
    constructor, method *or property*, such as `@Prop() settings: IUserSettings` — stays in
    Bun's output, and the boot dies with `SyntaxError: Export named 'IUserSettings' not found
    in module …`. tsc reports it as `TS1484`. `isolatedModules` alone (`TS1272`) misses the
    property case.
  - `import * as x` of a CommonJS package whose export is a function yields a namespace Bun
    will not call: `cookieParser is not a function. (In 'cookieParser()', 'cookieParser' is
    an instance of Module)`. Use a default import; tsc reports the call as `TS2349`.
- **A named value import from a CommonJS package must be an own property of its exports, and
  tsc cannot check that.** mongoose's `Connection` lives on the prototype, so
  `import { Connection } from "mongoose"` in a decorated constructor dies with
  `SyntaxError: Export named 'Connection' not found in module …/mongoose/index.js`. Import it
  as a type — `@InjectConnection()` supplies the injection token. `check:boot` exists for this
  class of error: it loads `AppModule`, resolves the DI graph in Nest's preview mode without
  instantiating providers or touching MongoDB, and generates the OpenAPI document. It needs no
  `.env`.

## Auth

- **Every path that ends a session clears the cookies in its own response, before anything
  that can throw.** The browser cannot drop the `httpOnly` cookies itself, so a logout that
  fails on the user update, or a refresh rejected because a logout elsewhere nulled
  `refreshToken`, otherwise leaves a valid `accessMoonToken` behind for up to seven days, and the
  web profile keeps treating that browser as its owner. `JwtRefreshGuard` and the refresh handler
  clear them on `UnauthorizedException` only — a database error must not log everyone out.

## Database

- **Declare reference paths as `@Prop({ type: mongoose.Schema.Types.ObjectId, ref })`; a bare
  `@Prop({ ref }) x: mongoose.Types.ObjectId` becomes a `Mixed` path.** Mongoose casts string
  ids only on `ObjectId` paths, so a query with a string id against a `Mixed` path matches
  nothing and returns an empty result instead of an error — reviews on the game page showed
  "Not rated" for authors who had rated the game. `Rating.userId`/`gameId` are declared the bare
  way, which is why `UserRatingsService` wraps every id in `new mongoose.Types.ObjectId(...)`.
  Before querying a model with string ids, check `schema.path(name).instance`, or convert
  explicitly (`asObjectId`/`asObjectIds` in `module/comments/utils`).
- **The `.env` connection string points at the production database, and Mongoose `autoIndex`
  is on.** A new `Schema.index(...)` is built on production the first time any local process
  loads that schema. One-off scripts that import schemas connect with `autoIndex: false`.

## Tests

- **A spec that imports anything reaching `shared/utils/rich-text.utils` must mock that
  module.** Jest runs the source as CommonJS and cannot load `htmlparser2`, the ESM-only
  dependency of `sanitize-html`, so the suite dies at import with `Must use import to load ES
  Module` before a single test runs. `comments.controller.spec.ts` mocks it with `jest.mock`.

## Storage

- **Everything lives in one DigitalOcean Space (`S3_BUCKET`, `mooncellar`); the former buckets are
  top-level folders listed in `S3_FOLDERS` (`src/shared/s3.ts`).** Keys go through `FileService`,
  which prefixes the folder — never build a `Bucket`/`Key` pair anywhere else. The one exception is
  the standalone `mcp/game-adder`, which runs outside Nest's DI; it takes the bucket, folders and
  CDN from the same `src/shared/s3`, so the two cannot drift apart.
- **A client-supplied `bucketName` must pass `resolveS3Folder` before it reaches `FileService`.**
  With one bucket the name is only a key prefix, so an empty or unknown value addresses the root:
  `DELETE /file/clear-bucket?bucketName=` would wipe every folder at once, and the unauthenticated
  `GET /file/bucket-keys` would list the whole Space. The resolver accepts a folder name or the
  legacy `mooncellar-<folder>` name (old frontend bundles still send it); the controller answers
  400 for anything else.
- **Build public URLs only with `FileService.getPublicUrl(folder, storedKey)`, from the key
  `uploadFile` returns.** `uploadFile` appends the extension itself. The hand-built URLs this
  replaced dropped it, so admin cover uploads were saved as links to objects that did not exist.
- **The storage variables were renamed on purpose, and the old names are no longer read.** The
  former `S3_HOST_CDN` carried a `%backet` placeholder; reading it under the new scheme would put
  `%backet` into every URL the IGDB cron writes into `games`. Configure `S3_ENDPOINT`, `S3_BUCKET`
  and `S3_CDN_URL` (each defaults to the production Space) plus `S3_ID`/`S3_KEY`. The signing region
  is `us-east-1`, as DigitalOcean's SDK docs specify — the datacenter lives in the endpoint.
- **Objects are copied with `scripts/transfer-s3.ts`, which drives rclone once per folder in
  `S3_FOLDERS`.** The source keys are `LEGACY_S3_ID`/`LEGACY_S3_KEY`, separate from `S3_ID`/`S3_KEY`
  because the copy needs both providers at once; the script refuses to run when the two IDs match,
  since that means the Space would be written with the regru keys. `common` is copied `private`
  (the filters JSON is read through the API), every other folder `public-read`. It compares by
  `--size-only`: keys are generated IDs whose content never changes, and anything stricter costs a
  HEAD per object across 2.3 million of them. `--tpslimit 250` stays under the 300 write operations
  per second older Spaces allow — above it Spaces answers `503 SlowDown`. Run `--check` before
  applying the URL migration.
- **Stored URLs are rewritten by `scripts/migrate-s3-urls.ts`, not at read time.** It maps both
  legacy forms (`s3.regru.cloud/mooncellar-<folder>/…` and `mooncellar-<folder>.s3.regru.cloud/…`)
  to `S3_CDN_URL/<folder>/…` across `games`, `characters`, `users`, `playthroughs` and `userlogs`.
  It is a dry run unless called with `--apply`; apply it only after the objects are copied into the
  Space, or every rewritten link 404s.

## Docker

- **Keep the `mongodb` service in `infra/docker-compose.yml` pinned to `mongo:7` — do not move it to `mongo:latest` or any
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
