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
- **Run a Bun script that imports decorated API code with `apps/api` as the working directory.**
  Bun takes decorator settings from the `tsconfig.json` of the working directory, not of the
  imported file. Started from the repository root, the same script dies inside `@Prop` with a bare
  `TypeError` thrown by `Reflect.getMetadata`; started from `apps/api` it runs. This applies to
  scratch scripts kept outside the app too.

## Auth

- **Every path that ends a session clears the cookies in its own response, before anything
  that can throw.** The browser cannot drop the `httpOnly` cookies itself, so a logout that
  fails on the user update, or a refresh rejected because a logout elsewhere nulled
  `refreshToken`, otherwise leaves a valid `accessMoonToken` behind for up to seven days, and the
  web profile keeps treating that browser as its owner. `JwtRefreshGuard` and the refresh handler
  clear them on `UnauthorizedException` only — a database error must not log everyone out.

## Sockets

- **Pin `@nestjs/websockets` and `@nestjs/platform-socket.io` to the major of `@nestjs/core`.**
  The npm `latest` of both is already 12.x while the app runs Nest 11, so a bare
  `bun add @nestjs/websockets` installs a gateway runtime that does not match the core it plugs
  into.
- **Global `APP_PIPE`/`APP_INTERCEPTOR` providers never reach a gateway handler.** Nest builds the
  WebSocket context creators without the application config, so `ZodValidationPipe` does not
  validate a `@MessageBody()` DTO and `HttpMetricsInterceptor` does not run. Validate a socket
  payload inside the handler (`DiscussionRoomRequestSchema.safeParse`) and answer through the ack.
- **Never broadcast a decorated `IComment`.** `decorate()` fills `isLiked`, `isReported` and the
  admin-only `reportsCount` for one viewer and keeps hidden bodies for admins, while a discussion
  room is anonymous — every subscriber would receive that one viewer's flags and the moderators'
  view. Events carry only what an anonymous reader already gets from REST, and anything
  viewer-specific is refetched. The contract is in [`docs/sockets.md`](../../docs/sockets.md).
- **Socket.IO server options belong in `SocketIoAdapter`, never in `@WebSocketGateway`.** Nest
  creates one server per port from the options of whichever gateway it initialises first and
  ignores the rest, so a `cors` block on one gateway silently decides CORS for every namespace —
  or for none, depending on module order. `src/shared/socket-io.adapter.ts` sets the origins and
  `credentials: true`, without which the `/royal` handshake receives no session cookie over
  long-polling.
- **An authenticated namespace reads the session once, from the handshake.** `RoyalGamesGateway`
  verifies `accessMoonToken` from `socket.handshake.headers.cookie` in namespace middleware; a
  rejected socket gets `connect_error` with `Unauthorized`, and Socket.IO does not retry it. The
  handshake belongs to the underlying engine connection, not the namespace, which is why the web
  client keeps `/royal` on its own `Manager`.
- **Pass `ObjectId`s into the `royalGames` update pipelines.** Mongoose casts ordinary updates but
  not aggregation-pipeline updates, so a string id would be stored as a string next to ObjectIds
  and the `$in` checks that deduplicate the list would never match it.

## User logs

- **A playthrough log records what changed and never the note.** `getPlaythroughMeta` builds the
  four log fields (Status, Console, Date, Time); adding and removing a playthrough render all of
  them, an update renders only the ones that differ from the document read before the write, and
  a field that was cleared shows as `—`. The comment is a review, shown on the game page and on
  the profile; copying it into the log duplicated it into a place where deleting the log was the
  only way to take it back.
- **Old logs are stripped when they are read, not migrated.** `renderLogText` removes both stored
  shapes per segment — `<div style="font-size: 12px">Comment:</div>` with everything after it, and
  the older `<br/>Comment: …` that ran to the end of its `<span>` — so historical rows keep their
  text in the database while the API stops serving it. Log rows are HTML snapshots written at
  action time, so the rendering step is the only place that can change what they show.

## Custom lists and favourites

- **Public user search is `GET /users/search`; never point a search box at `GET /user/search`.**
  The older endpoint matches an exact e-mail as well as a user name, so exposing it would tell
  anyone whether an address has an account. The new one matches names only and returns public
  fields.
- **Every write to `CustomList.games` must also set `gamesCount`.** The catalogue filters on it
  (`gamesCount >= minGames`, and `>= 1` hides empty lists) and sorts by it without looking at the
  array, so a write that forgets it makes a list vanish from `/lists` or sort as empty.
- **A rename moves the old slug into `previousSlugs`; never drop that array.** `getBySlug` matches
  previous slugs so the web route can `permanentRedirect` — links shared before the rename keep
  working only through it.
- **`likesCount` changes only through `$inc` with `timestamps: false`, and only when the like
  document was actually inserted or deleted.** A like must not move `updatedAt`: "Recently
  updated", the popularity tie-break and the profile's Lists panel all order by it, so a like that
  bumps it reshuffles lists nobody edited. The unique `{ listId, userId }` index makes a repeated
  like a no-op — keep reading `upsertedCount`/`deletedCount` rather than incrementing blindly.
- **Lists with a `generator` belong to `GeneratedListsService`, never to a person.** They are owned
  by the `MoonCellar` account, rebuilt every Monday (and by `POST /lists/generated/refresh`), and a
  rebuild overwrites their games, name and description — an edit made by hand is lost within a
  week. The unique partial index on `generator.kind` + `generator.key` is what stops two API
  processes (the server and a local `dev:api` on the same database) from creating a list twice;
  keep it. The platform set is `FEATURED_PLATFORM_SLUGS` from `@mooncellar/schemas`, shared with
  the home page's "Browse By Platform", so changing one changes both.
- **Adding or removing a game in a list never writes a user log.** Lists are edited in bulk, and
  logging every addition buried playthroughs and ratings in the activity feed; the feed records
  what happened to a game, not how it was filed. Favourites do log, through the `favorite`
  segment.

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

- **A game's characters are read from `character.gameIds`, never from `game.characters`.**
  `CHARACTERS_LOOKUP_STAGE` joins on `gameIds` because `linkGameCharacters` (IGDB) and
  `linkVndbCharacters` rewrite `game.characters` with only their own characters every run, so a
  character created by an admin or an approved request vanished from its game's page after the
  next sync. The syncs recompute `gameIds` only for characters that carry their `igdb`/`vndb`
  field, which leaves manual links alone.
- **An image URL that came from a user is fetched only through `FileService.uploadRemoteImage`.**
  It goes through `downloadRemoteImage`, which refuses non-http(s) links, private, loopback and
  link-local addresses on every redirect hop, non-image content types and bodies over 15 MB. A
  plain `axios.get` on a request's link lets anyone point the server at the cloud metadata
  endpoint or the internal network.

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
- **Duplicate game images are found by md5 *and* by perceptual hash, because neither alone finds
  them all.** `ImageDedupeService` (`POST /games/images/dedupe/:slug`, and the background run on
  `POST /games/images/dedupe`) needs both: IGDB serves the same picture under several `image_id`s,
  which is byte-identical and md5 catches it, while the copy of a picture that VNDB also has was
  fetched through IGDB's `t_1080p` transform (`getImageLink(url, "1080p")` in `igdb.service.ts`) —
  an upscale of a smaller original, so every byte differs and only the perceptual hash matches it.
- **The perceptual hash is a 256-bit dHash and `DEFAULT_PERCEPTUAL_THRESHOLD` is 10; do not raise it
  much.** Measured over the Grisaia and Patlabor screenshot sets, real duplicates land at distance
  0–7 and the nearest non-duplicate at 23 — and those non-duplicates are the same CG with different
  dialogue or a different localisation, which a looser threshold would delete. The 64-bit variant
  put that boundary at 4 against 10 and is too tight to use.
- **Delete a dropped image only after comparing `parseS3ImageUrl` refs, never URL strings.** A
  legacy `s3.regru.cloud/mooncellar-screenshots/<key>` URL and the current
  `S3_CDN_URL/screenshots/<key>` URL are different strings addressing the same object in the Space,
  so deleting the dropped one by URL would take the kept one with it. This is also what keeps the
  orphan sweep safe before `migrate-s3-urls.ts --apply` has run: a game still holding regru URLs
  resolves to the same keys, so its objects count as referenced instead of as orphans.
- **`ImageOrphansService` reads every reference first and only then lists the Space, and it never
  deletes an object newer than `cutoff`.** An object uploaded between the two steps is in the
  listing but not in the reference set, so it would look like an orphan; `cutoff` is the earlier of
  the scan's start and `now - minAgeDays` (7 by default) and excludes it. Lowering `minAgeDays` to 0
  leaves only the scan-start guard, which is enough for a run nothing else is writing during.
- **The reference set covers `games.cover`/`screenshots`/`artworks` *and* the rich-text fields
  `gamecomments.body`, `playthroughs.comment`, `userlogs.text`.** Those hold pasted URLs that can
  point at a cover or a screenshot; none do today, but the three collections are small enough that
  scanning them costs nothing and a deletion there is not recoverable.
- **`LastModified` in the Space is the rclone copy time, not the original upload, so a fresh
  `transfer-s3.ts` run hides the whole corpus behind `minAgeDays`.** The objects copied from regru
  all carry the date of the transfer — a cover for `the-fruit-of-grisaia` that no game has
  referenced for months still reads `2026-09-11`. After a transfer, either wait out `minAgeDays` or
  lower it deliberately; do not read a run full of `tooRecent` as "no orphans".
- **The sweep refuses to delete rather than trusting a scan that looks wrong:** an empty reference
  set for a folder, more than 500k orphans in one run, or orphans above `maxDeleteRatio` (0.2)
  all report `refusedReason` and delete nothing. Narrow a large run with `prefix`, which limits the
  listing while the references are still read from the whole catalogue.

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
- **A game with a `vndb` field belongs to VNDB, and no IGDB write may touch it.** VNDB is the
  priority source: `upsertGameFromIgdb` returns early on `existingGame.vndb`, and
  `linkRelatedGames` / `linkGameCharacters` skip those games. Every `select` that feeds
  `upsertGameFromIgdb` must include `vndb`, or the guard sees `undefined` and the nightly sync
  silently overwrites VNDB data. Do not move the guard into the upsert filter as
  `vndb: { $exists: false }`: with `upsert: true` a filter that matches nothing inserts a
  duplicate game.
- **The unique indexes on `igdb.characterId`, `vndb.characterId` and `vndb.vnId` must stay
  partial (`$exists: true`).** MongoDB indexes a missing field as `null`, so the second document
  without it fails with `E11000 duplicate key ... { igdb.characterId: null }`. Mongoose
  `autoIndex` never changes the options of an existing index, so on an existing database the old
  `igdb.characterId_1` must be dropped by hand before the partial one can be built.

## VNDB

- **`bulkWrite` skips Mongoose middleware, so every VNDB game write sets `nameNormalized`
  itself.** The `name` hook in `game.schema.ts` only runs for `save`/`updateOne`/`updateMany`
  queries; a game written through `bulkWrite` without it is never found by the
  `nameNormalized` lookup that VNDB matching and search rely on.
- **VNDB images are stored under `<folder>/<gameId>/<vndbImageId>` and must stay that way.**
  `insertVndbGame` skips any image whose key the game already references, so `backFill` can be
  re-run without re-uploading. A random key (as `sendArrayToS3` uses) uploads every cover and
  screenshot again on each run and leaves the previous copies orphaned in the Space.
- **`insertVndbGame` writes an existing game only when a compared field actually changed, and
  every field it writes must also be in the `select` of existing games.** It compares each value
  with the stored one and skips the game otherwise, so `updatedAt` (the sitemap `lastmod`) does
  not move on a re-run. A field missing from the `select` always compares as changed, and every
  VNDB game gets a fresh `updatedAt` on each `backFill`.
- **Every VNDB API call goes through `VndbService.post`, which spaces requests
  `VNDB_REQUEST_DELAY_MS` apart.** VNDB allows 200 requests per 5 minutes; a call made straight
  through `httpService` skips the spacing, a long backfill starts collecting 429s, and once `post`
  runs out of retries the whole run aborts.
- **`post` spaces requests through the `requestTurn` promise chain, never by reading `lastRequestAt`
  alone.** The admin review preview, the decision worker and the sync call `post` at the same time;
  each reading the timestamp directly sees the same value, they fire together, and the combined
  rate breaks the 200-per-5-minutes limit mid-backfill.
- **A review decision is only recorded by `decideCandidate`; `applyDecisions` writes the games in
  batches of up to `VNDB_PAGE_SIZE`.** Building one VN costs about 18 VNDB requests (one per theme
  tag in `getThemes`), roughly 30 seconds at the enforced spacing, and the batched calls cost the
  same for 100 VNs. Writing the game inside the decision request holds it open for half a minute
  per keypress.
- **VNDB has no last-modified field, so the daily sync re-fetches the linked games with the
  oldest `vndb.syncedAt`.** `insertVndbGame` carries the stored `syncedAt` inside the `vndb` value
  it compares; dropping it makes `vndb` differ on every refresh and moves `updatedAt` for every
  refreshed game.
- **A VNDB request that filters by several ids must pass `results`.** VNDB returns 10 items by
  default and reports the rest only through `more: true`; the detail request in `getVnMatches`
  once ran without it and silently processed 10 of every 100 VNs on a page, with no error.
