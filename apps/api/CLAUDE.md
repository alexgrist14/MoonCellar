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
  client opens `/royal` and `/notifications` on their own account `Manager`.
- **Pass `ObjectId`s into the `royalGames` update pipelines.** Mongoose casts ordinary updates but
  not aggregation-pipeline updates, so a string id would be stored as a string next to ObjectIds
  and the `$in` checks that deduplicate the list would never match it.

## Notifications

- **A module whose provider injects `NotificationsService` must import `NotificationsModule`, and
  so must every other module that lists the same provider.** `AuthModule` provides its own
  `UserFollowingsService` next to `UserModule`'s, so importing the module into `UserModule` alone
  failed `check:boot` with "Nest can't resolve dependencies of the UserFollowingsService (UserModel,
  ?) … in the AuthModule module". Grep `providers:` for the service before wiring it.
- **Call `notify()`, `retract()` and `removeBySubject()` after the write and never `await` them
  in the request path.** They log and swallow their own errors, so a failed notification never
  fails the like, reply or decision behind it. The flow is in
  [`docs/notifications.md`](../../docs/notifications.md).
- **The upsert is an aggregation-pipeline update, so every id in it is an `ObjectId` and every
  stored string goes through `$literal`.** Mongoose casts neither, and a list or game name that
  starts with `$` would otherwise be read as a field path.
- **Grouping relies on the unique partial index `{ userId, groupKey }` where `isRead: false`.**
  Two events at the same moment race on the upsert; the loser gets `E11000` and `notify()`
  retries once, which then joins the winner's group. Do not drop the index or switch the filter
  to `readAt: null`.

- **A push endpoint is accepted only from `PUSH_SERVICE_HOSTS` over https.** `PushService` POSTs
  to the stored endpoint, so dropping the check lets any user point the server at an internal
  address. Extend the list when a browser ships a new push service, never replace it with a bare
  URL check.
- **`VAPID_*` must be one pair across every process on the same database.** A subscription is
  bound to the public key it was made with; a second pair makes the push services answer 403, and a
  new pair orphans every stored subscription.

## User logs

- **A log stores state, never text: `playthrough` (`action`, `before`, `after`), `rating`
  (`value`, `previous`) and `favorite`, and the web builds every sentence from them.** The
  former HTML text was parsed back with regexes on read, so rewording a header silently broke
  old rows, and a status stored as "Mastered" *or* the category lost that a game was completed.
  Rows written before the change are converted by `scripts/migrate-user-logs.ts` (dry run unless
  `--apply`).
- **Every write goes through `recordUserLog`, which merges into the user's latest log when it is
  for the same game and the same playthrough, using `mergeLogChanges`.** A merge keeps the
  *first* `before` and the *last* `after`, and drops a part that nets to nothing (added then
  removed, rating set then removed, an update reverted). Replacing the whole part instead is what
  made a repeated save with nothing changed overwrite the recorded update with an empty one.
- **The playthrough state never includes the comment, only `hasReview`.** The comment is a review
  shown on the game page and the profile; copying it into the log made deleting the log the only
  way to take it back. `hasReview` must match `PUBLIC_REVIEW_FILTER` in `reviews.service.ts`
  (public, not wishlist, non-empty), or the feed announces reviews the game page does not show.
- **The platform name is stored next to `platformId`.** A log is a snapshot of the action, and
  the name saves a platform lookup in every module that provides `UserLogsService`.
- **A merge writes with the `__v` it read in the filter and retries on a miss.** Two requests
  for the same game (a playthrough save and a rating) otherwise read the same log and the second
  write drops the first one's change.

## Account deletion

- **A new collection that stores a user id must be cleaned up in `AccountDeletionService`
  (`module/user/services/account-deletion.service.ts`).** It is the only path that deletes a
  user — `DELETE /user/account/:userId` (password re-entered) and the admin
  `DELETE /admin/users/:userId` both call it — so a collection it does not know keeps orphaned
  personal data after the account is gone, and a counter it does not repair (`likesCount`,
  `helpfulCount`, `repliesCount`, game ratings) stays inflated forever.
- **It matches `Rating`, `UserLogs` and `Playthrough` by `{ $in: [ObjectId, string] }`.** Their
  `userId` is a bare `@Prop({ ref })`, i.e. `Mixed`, and older rows hold either form; the admin
  delete it replaced passed the string alone and left ObjectId rows behind.
- **The user's comments are soft-deleted (`status: "deleted"`, empty body), never removed,** so
  reply threads keep their structure; content requests, conflicts and comment reports keep the
  dangling `userId`, which resolves to no author.
- **A wrong password answers 403, not 401.** The web `agent` treats every 401 as an expired
  session and retries after a refresh, which would loop on a wrong password and then log the
  user out.

## Gauntlet history

- **Never add a single-segment `GET /user/<word>` route.** `UserProfileController` declares
  `@Get(":userId")` and is registered first, so `GET /user/gauntlet-history` reached `getUser`
  with `userId = "gauntlet-history"`. That is why the history has its own `gauntlet-history`
  controller prefix; take the viewer from `request.user`, not from a path id.
- **A history lives in `gauntlethistories`, one document per user and game (unique
  `{ userId, gameId }`), ordered by `wonAt`.** A re-won game moves to the top instead of
  appearing twice, unknown game ids are dropped, and every add trims the list to
  `GAUNTLET_HISTORY_LIMIT` (oldest first). The limit is what keeps `GET /gauntlet-history/ids`
  small — the web sends that whole list as `excludeGames` for "Exclude history".

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
  updated", the popularity tie-break and the profile's Lists panel (after the owner's
  `position`) all order by it, so a like that bumps it reshuffles lists nobody edited. The unique `{ listId, userId }` index makes a repeated
  like a no-op — keep reading `upsertedCount`/`deletedCount` rather than incrementing blindly.
- **`PATCH /lists/order` must stay declared above `PATCH /lists/:id` in the controller, and it
  writes `position` with `timestamps: false`.** Express matches routes in declaration order, so
  below `:id` the reorder hits `updateList` with `id = "order"` and fails with 400 on the id. A
  list that was never reordered keeps `position: 0` and sorts first, which is where a new list
  should appear.
- **Lists with a `generator` belong to `GeneratedListsService`, never to a person.** They are owned
  by the `MoonCellar` account, rebuilt every Monday (and by `POST /lists/generated/refresh`), and a
  rebuild overwrites their games, name and description — an edit made by hand is lost within a
  week. The unique partial index on `generator.kind` + `generator.key` is what stops two API
  processes (the server and a local `dev:api` on the same database) from creating a list twice;
  keep it. The set is decades, each of the last `GENERATED_LIST_RECENT_YEARS` years, the
  standalone expansions, `GENERATED_LIST_COMPANIES` and `GENERATED_LIST_KEYWORDS`; the genre and
  platform lists were dropped on purpose. A refresh deletes every generated list (and its likes)
  whose `kind` + `key` is no longer defined, so the year window rolls forward without leaving a
  frozen list behind — and renaming a `key` deletes the old list with its likes instead of
  renaming it.
- **A company list matches the developer role only, by name pattern.** IGDB records regional
  publishers, so a publisher match put Warcraft III and GTA III into "Best Capcom games"; the
  patterns are prefixes so a family's studios (Rockstar North, Nintendo EAD, Ubisoft Montreal)
  count. Companies are chosen by popularity — the IGDB votes of their ten most-voted games — not
  by how many games they have, which would rank Konami above FromSoftware.
- **Game search ranks by match kind, never by the fuzzysort score.** `getSearchRelevanceTier`
  puts the exact name first, then names starting with the query as a whole word, then names
  holding it as a whole word later, then substrings, then fuzzy matches, and sorts by votes
  inside each tier. The score mostly measures title length:
  "eden" scored `edengrad` 0.907 and `metal eden` 0.884, so score thresholds put a dozen unrated
  short titles above every popular game with the word in its name.
- **The search index holds one entry per name variant — the name, each `alternative_names`
  entry, and the Arabic-numeral form of each — and a game takes the best tier of its entries.**
  `getSearchNames` builds them and `searchIndex` folds the matches back to one row per game;
  `getGames` counts `total` from that list, so a game matched twice must not appear twice.
- **Search text goes through `normalizeSearchText`, never `normalizeGameName`.** The latter keeps
  only `a-z0-9` because it feeds the stored `nameNormalized` that the source matchers compare;
  used for search it turned "Ведьмак 3: Дикая охота" into "3" and a Cyrillic query into an empty
  one. Query and index must use the same normaliser, or nothing matches.
- **`POST /lists/by-slug` filters a list's games with the catalogue's `gamesFilters`, restricted
  to the list's ids, and searches names by substring of `nameNormalized`.** The GET stays for the
  server render and the unfiltered page. The response keeps `gamesCount` as the full count and
  each game's list `position`, so ranks stay true inside a filtered view.
- **Adding or removing a game in a list never writes a user log.** Lists are edited in bulk, and
  logging every addition buried playthroughs and ratings in the activity feed; the feed records
  what happened to a game, not how it was filed. Favourites do log, through the `favorite`
  segment.
- **A single favourite is added or removed through `POST`/`DELETE
  /user/:userId/favorites/:gameId` (and `favorite-characters/:characterId`), never through the
  `PATCH` that replaces the whole list.** The client builds lists from the persisted auth-store
  profile, which can be older than the database (another tab or device), and a replace built from
  it silently deletes favourites added elsewhere. The `PATCH` is for the reorder editors only.
  Deleting a character must also pull it from `favoriteCharacters`, or every later replace fails
  with "One of the characters does not exist".

## Steam import

- **A linked Steam library lives in `steamlibraries` (one document per user), never in a custom
  list or on the user document.** `GET /user` responses return the whole user in many places, and
  a library of a few thousand games would travel with each of them. `POST /steam/library` reads
  it with the user's `steam.achievements`, filters through `CustomListsService.findMatchingGames`
  and sorts with `sortSteamLibrary`. Lists with `source: "steam"` are legacy: every import deletes
  the user's one (`deleteSourceList`), and `CustomListsService` still refuses edits to any list
  with a `source` (403). The flow and the endpoints are in [`docs/steam.md`](../../docs/steam.md).
- **The nightly Steam run is `SteamAccountService.syncAllCron` (05:15): it re-imports each
  library, which then reads achievement progress.** `SteamProgressService` has no cron of its own;
  a second one would read progress against a library the import is about to replace.
- **The OpenID `return_to` is compared exactly with `<FRONT_URL>/user/<name>/settings` of the
  signed-in user, and the assertion is linked only after Steam answers `is_valid:true` to
  `check_authentication`.** Skipping either lets anyone post a forged or replayed claimed id and
  import someone else's library.
- **`GetOwnedGames` answers `{ response: {} }` for a profile whose game details are private.**
  It is not an error status; treat a missing `games` array as "private" (422), never as an
  empty library, or the import replaces a full library with nothing.

- **Steam achievement counts come from `ISteamUserStats/GetSchemaForGame` with `STEAM_API_KEY`,
  never from the store's `appdetails`.** The Web API allows about 100,000 calls a day; the store
  endpoint about 200 per five minutes, which would take days for the ~180,000 games that carry a
  Steam app id (`externalPages` entry `Steam`, numeric `uid`). `SteamAchievementsService` runs
  nightly (`STEAM_ACHIEVEMENTS_CRON`, at most `STEAM_ACHIEVEMENTS_DAILY_LIMIT` games under the
  `steam-achievements-sync` lock): games never read first, then counts older than
  `STEAM_ACHIEVEMENTS_STALE_DAYS`. `200 {"game":{}}`, `403 {"game":{}}` and `400` mean "no
  achievements" and store `total: 0`; any other failure stores nothing, and 10 failures in a row
  stop the run — the HLTB sync once read failures as "not found" and hid 60,000 games. Steam
  answers an app without a stats schema with `403 {"game":{}}` and a bad key with a `403` HTML
  page, so `fetchTotal` reads the body of a 403 before failing: counting every 403 as a failure
  aborted each run after 10 schema-less games. Admins trigger it with
  `POST /steam/achievements/sync` and one game with `POST /steam/achievements/games/:gameId`.

- **A linked user's Steam progress comes from `IPlayerService/GetTopAchievementsForGames`, 100
  apps per request.** With a large `max_achievements` it returns, per app, the total and every
  achievement the user unlocked, so a 700-game library costs 8 requests instead of one
  `GetPlayerAchievements` per game. It is not in Steam's published docs; if it changes, fall back to
  `GetPlayerAchievements`. `SteamProgressService.syncUser` runs after every library import (link,
  Update library) and nightly for every linked account, stores only games with at least one
  unlocked achievement in `user.steam.achievements` (`appId`, `gameId`, `unlocked`, `total`,
  `masteredAt`), and takes `masteredAt` from the last unlock time of `GetPlayerAchievements` for
  newly mastered games only (`STEAM_PROGRESS_MASTERED_LOOKUPS` per run). A failure there never
  fails the library import. `SteamPlaythroughsService` mirrors the RA one: only for a user with
  `settings.steamSyncPlaythroughs`, a mastered game gets a `completed` + `isMastered` playthrough
  marked `steamAppId`, never on a game the user already has a playthrough of, and deleting it adds
  the app to `steamIgnoredApps`.
- **The RA sync fills in set data for every linked set that lacks it** (`fillMissingSetData`):
  from the downloaded lists when the set is there, otherwise one `getGameExtended` per set, at most
  `RA_MISSING_SET_LOOKUPS` per run. A link the run did not match again — kept on purpose — or a set
  on a console no platform maps to would otherwise stay without its icon and count forever.

- **Read every Steam page of a game (`getSteamUids`), never only the first.** A game often carries
  two (an expansion or a re-release on its own app); reading the first one alone sent 1,031 apps
  that were already linked to their game into conflicts as "another Steam app" (RACE On, app 8780,
  next to 8640). `steam` holds one app (`pickOwnApp`: the same name first).
- **A game's Steam link lives in `steam` (`appId`, `name`, `updatedAt`), filled by
  `SteamGamesService` from `IStoreService/GetAppList` (all ~190,000 Steam games, 50,000 per
  request).** A game whose `externalPages` already carries a Steam id is linked directly (~143,000).
  A Steam app nobody links is matched by exact `nameNormalized`: it links on its own only when
  there is one candidate, the candidate has no Steam id of its own and PC (`win`, `mac`, `linux`)
  among its platforms; any other name match becomes a `steam` conflict (direction `games`) with
  the app snapshotted in `externalData`. Skip creates the game, as for VNDB: `createGame` reads the
  store page (`appdetails`), takes the 600×900 library poster as the cover (the header image when
  there is none) and `library_hero` as the background, and saves it through
  `GamesService.addGame` (`isCustom`, images uploaded to the Space), so the conflict cannot be
  reopened. A resolved conflict pins its
  winners on every later run, so a link survives an IGDB sync that rewrites `externalPages`. Apps
  with no name match (~44,000) are not imported as new games on their own.

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
- **A local API is a second production instance: keep `DISABLE_CRONS=true` in the local `.env`.**
  The `.env` also carries the production Space, so every cron a local `bun start:dev` runs writes
  to both. With the flag set, `ScheduleModule` is not loaded and no `@Cron` fires.
- **A job that writes games or images guards itself with `withDbLock` (`shared/cron-mutex.ts`),
  not only with an in-memory flag.** `isRunning` and `runCronExclusive` exist per process. On
  2026-09-28 two processes ran the VNDB sync at once, and the unique `vndb.vnId` index rejected
  the loser's games after its images were uploaded, which left about 1,250 orphan folders in the
  Space. The VNDB sync and the IGDB games and characters syncs take the lock today.

- **A game's characters are read from `character.gameIds`, never from `game.characters`.**
  `CHARACTERS_LOOKUP_STAGE` joins on `gameIds` because `linkGameCharacters` (IGDB) and
  `linkVndbCharacters` rewrite `game.characters` with only their own characters every run, so a
  character created by an admin or an approved request vanished from its game's page after the
  next sync. The syncs recompute `gameIds` only for characters that carry their `igdb`/`vndb`
  field, which leaves manual links alone.
- **Stored site cookies (`SitesService`, admin Sites tab) are sent only when a caller passes
  `{ useSessions: true }` to `downloadRemotePage`/`downloadRemoteImage`/`uploadRemoteImage`,
  and only admin paths do: AI drafts, portrait search, admin game and character saves.** A link
  from a user request must never get them, or anyone could make the server fetch a page as the
  admin's account. The headers are looked up per redirect hop, so a cookie never follows a
  redirect to another host.
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
- **`mcp/game-adder` runs `sharp` in a `node` subprocess, never in its own Bun process.** Under
  Bun 1.4 the first `sharp(...)` call (even `.metadata()`) never resolves on the dev machine, while
  the same call under Node answers in milliseconds, so an in-process call hangs `create_game` with
  no error. The server also does not rely on `ffprobe`/`ffmpeg`: they were missing locally, and the
  upload code silently skipped the cover and every artwork, which left the external URLs in the
  game and made `next/image` fail the game page with 500 on an unconfigured host.
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
- **`FileOrphansService` (`POST /file/orphans`) reads every reference first and only then lists the Space, and it never
  deletes an object newer than `cutoff`.** An object uploaded between the two steps is in the
  listing but not in the reference set, so it would look like an orphan; `cutoff` is the earlier of
  the scan's start and `now - minAgeDays` (7 by default) and excludes it. Lowering `minAgeDays` to 0
  leaves only the scan-start guard, which is enough for a run nothing else is writing during.
- **Every field that stores a Space URL must be listed in `REFERENCE_SOURCES`
  (`file-orphans.service.ts`), or the sweep deletes its files.** Today that is `games.cover`,
  `screenshots`, `artworks`, `backgroundImage`, `bannerImage`, `characters.mugShot`,
  `users.avatar`/`background`, `generatedimages.url` and the rich-text `gamecomments.body` and
  `playthroughs.comment`.
  The first version read only the three game image arrays and would have removed every game
  background and banner. A new image field goes into that list in the same change.
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

- **Editions are linked from IGDB `version_parent`, which no array field mirrors.** IGDB leaves an
  edition's `dlcs`, `remakes`, `similar_games` and the rest empty and builds its "Editions" block
  from `version_parent` alone, so `linkRelatedGames` reading only the arrays gave the 8,046 editions
  no related games at all. `buildEditionLinks` sets `relatedGames.version_parent` (the original)
  and `relatedGames.editions` (the original's other editions, or on the original every edition);
  the web shows both in the Versions tab. Requests cannot set either: the nightly run recomputes them.
- `linkGameCharacters()` loads every game to reconcile both sides, so it must only write rows
  that actually changed — `isSameObjectIdList` guards each `bulkWrite` op. Without that guard a
  nightly re-run rewrites all ~376k game documents and bumps their `updatedAt`, which
  `getGameSlugs` feeds to the sitemap as `lastmod` — every game would look freshly edited
  every day.
- **A game with a non-empty `vndb.vnId` belongs to VNDB, and no IGDB write may touch it.** VNDB
  is the priority source: `upsertGameFromIgdb` returns early on `existingGame.vndb.vnId`, and
  `linkRelatedGames` / `linkGameCharacters` skip those games. Check the id, never the presence
  of the `vndb` object: a leftover `vndb` with `vnId: ""` hid the IGDB parse buttons and made
  the sync skip an IGDB game. Every `select` that feeds `upsertGameFromIgdb` must include
  `vndb`, or the guard sees `undefined` and the nightly sync silently overwrites VNDB data. Do
  not move the guard into the upsert filter: with `upsert: true` a filter that matches nothing
  inserts a duplicate game.
- **The unique indexes on `igdb.characterId`, `vndb.characterId` and `vndb.vnId` must stay
  partial (`$exists: true`).** MongoDB indexes a missing field as `null`, so the second document
  without it fails with `E11000 duplicate key ... { igdb.characterId: null }`. Mongoose
  `autoIndex` never changes the options of an existing index, so on an existing database the old
  `igdb.characterId_1` must be dropped by hand before the partial one can be built.

- **The nightly IGDB sync checks a new IGDB game against the catalogue before inserting it;
  nothing else does.** `syncGamesFromIgdb` passes `matchNew`, and `matchNewIgdbGame` runs the
  shared matcher with `IGDB_MATCH_PROFILE`. A match goes to Conflicts unless `IGDB_AUTO_LINK` is
  `true`, and a hand-made game (`isCustom`) always goes to Conflicts. Without this check a game
  added by hand got a second IGDB copy with a `-2` slug, because `upsertGameFromIgdb` matches
  only on `igdb.gameId`. An explicit parse by id (admin, content request, backfill) skips the
  check on purpose.
- **A new IGDB game is never matched to a catalogue game that already carries another IGDB id,
  and only a confirmed match links itself.** `matchNewIgdbGame` drops candidates linked to a
  different `igdb.gameId` before scoring (`withoutOtherIgdbGames`): an IGDB entry can only be one
  catalogue game, and without this every edition, bundle and pack ("Premium Box", "Digital Deluxe
  Edition", "Pack / Addon") went to Conflicts against its own base game — admins skipped all of
  them. A match links without review when it is the only candidate and title, companies and date
  all confirm it (`isConfirmedIgdbMatch`), even with `IGDB_AUTO_LINK` off; anything weaker waits
  in Conflicts. A title that normalises to nothing ("***") gets no candidates, and a conflict keeps
  at most `IGDB_CONFLICT_CANDIDATES_LIMIT` (10) candidates — one such title once stored 784.
- **The game schema's name hook must never leave `nameNormalized` in both `$set` and `$unset`.**
  A symbol-only name normalises to an empty string; the hook unsets the field and removes it from
  `$set`, or Mongo rejects the write with "Updating the path 'nameNormalized' would create a
  conflict" and the game cannot be created.
- **Adding a game by hand checks the catalogue first and answers `409` with the likely
  duplicates.** `POST /games/add` and approving a new-game request call
  `GameMatcherService.assertNoDuplicates`; `force` skips the check once the admin has looked.
  Approving a new-character request answers the same `409` shape from a name/akas lookup.
  The game-adder MCP checks `POST /games/add/duplicates` before it uploads anything, because it
  uploads images to the Space before it calls `/games/add`, and a refusal after the upload
  leaves orphans in the bucket.
- **A content request is decided only through its claim.** `decide` claims the request with one
  `findOneAndUpdate` on `status: "pending"` and no live `claimedAt` before it creates anything,
  and every other write (reject, withdraw, the final `approved`) filters the same way and answers
  `409` on `matchedCount: 0`. Reading `pending` and writing later let two admins approve one
  request at once: two games, two image uploads. A claim older than `CLAIM_TTL_MS` (15 minutes)
  is taken over, which is the recovery path after a crash. A failed approval deletes the entry
  it created (and its images) and clears the claim; leaving the entry made every retry fail with
  the duplicate `409` against it. The flow is in [`docs/requests.md`](../../docs/requests.md).
- **IGDB only fills the empty fields of a hand-made game, and never changes its slug.**
  `getFillOnlyPayload` keeps every non-empty field; images are fetched only for an empty cover,
  screenshot or artwork list; `forceParse` is ignored. Once a hand-made game is linked to IGDB
  the nightly sync reaches it by `igdb.gameId` again, so without this rule the first sync
  after linking would overwrite everything the admin wrote. To hand a game over to IGDB
  completely, clear `isCustom`.
- **`IgdbOrphansService` removes games whose `igdb.gameId` IGDB no longer returns, and it never
  deletes a game anyone owns or uses.** `POST /igdb/orphans` (`{ apply?, limit? }`, a dry run by
  default) answers 202 and runs in the background; `GET /igdb/orphans` reads the report. The
  same job runs every Monday at 02:00 Moscow time (`IGDB_ORPHANS_CRON`) in apply mode with the
  default delete limit (500); both take the `igdb-orphans` `withDbLock`, so a manual run and the
  cron never overlap. Games with `isStopParsing` are not scanned. A VNDB-owned (`vndb.vnId`) or
  hand-made (`isCustom`) game only loses its dead `igdb` field; a game referenced by playthroughs,
  ratings, user logs, comments, custom lists, favourites or royal games is kept and reported for
  the admin to decide. The rest goes through `GamesService.deleteGame`, which also removes the
  game's images from the Space and pulls it from `characters.gameIds`/`spoilerGameIds`.
- **The orphan run writes nothing when the IGDB answer looks wrong.** A batch that still fails
  after three attempts, more than `IGDB_ORPHANS_MAX_MISSING` (5000) missing games, or more than
  `IGDB_ORPHANS_MAX_RATIO` (2%) of the scanned games missing sets `refusedReason`, and the run
  only reports. An IGDB outage that answers with empty arrays would otherwise read as "every
  game is gone" and wipe the catalogue. An unknown answer counts as present, never as missing.

## Conflicts

- **Every parser queues its unsure matches in the one `conflicts` collection, keyed by
  `(source, externalId)`, and applies decisions through its own handler.** A source calls
  `ConflictsService.register` in `onModuleInit` with `describe` (the live entry shown on the
  review screen) and `apply` (writes the decided batch, returns the game id per entry).
  `ConflictsService` owns statuses, the socket and the queue, so it never imports a parser, and
  a parser can write conflicts without a cycle. A source with no registered handler answers 400.
- **`scripts/migrate-vndb-candidates-to-conflicts.ts --apply` runs once, right after the API
  that reads `conflicts` is deployed.** Until then the running API still reads
  `vndbcandidates`, and the migration only inserts records that are missing, so a decision
  made on the old API after the copy is lost. Drop `vndbcandidates` only after checking the
  Conflicts tab on production.
- **A conflict has a direction, and it decides what the candidates are.** `games` (VNDB, IGDB,
  RA) lists catalogue games for one source entry, and the decision carries `gameId`. `entries`
  (HLTB) lists source entries for one catalogue game, so `externalId` is the game's `_id` and the
  decision carries `entryId`. What Skip means belongs to the source, not the direction: it
  creates a game for VNDB and IGDB and leaves the entry unlinked for RA and HLTB.
- **A handler's `apply` returns `null` for an entry it applied without a game.** Leaving an entry
  out of the map sends the decision back to review, so an RA or HLTB Skip that returned nothing
  would come back to the queue forever.
- **Only a source whose Skip creates nothing may implement `rematch`, and only `absent`
  conflicts are reopened.** `POST /conflicts/:source/:externalId/reopen` puts a skipped conflict
  back to `pending` with candidates rebuilt by the handler's `rematch`, so a game added to the
  catalogue after the Skip shows up. A VNDB or IGDB Skip has already created a game; reopening it
  would leave that game behind and let a Match link the entry a second time. RA implements it;
  HLTB does not yet, and Steam must not (its Skip creates a game).
- **A game the matcher missed is matched by adding it to the candidates first, never by passing
  its id to `decision`.** `decide` only accepts winners that are already among `candidates`
  (otherwise `400 The game is not a candidate`), so `POST /conflicts/:source/:externalId/candidates`
  prepends the game an admin found by search, unscored (`score: 0`, an all-zero breakdown,
  `isManual: true`), to a waiting `games`-direction conflict; the admin then matches or skips as
  usual. The list filters by `state`, each mapped onto `status`/`decision` in `STATE_FILTERS`.
- **`matchGames` recomputes every RA link each run, so it must read the RA conflicts first.**
  A resolved conflict pins its winners, and a pending or skipped one links nothing. Without this
  the next nightly run replaces an admin's decision with the fuzzy match again. The run also
  pulls an RA set from every game it did not match when the run gave that set to another game, so
  one set never stays on two games after a conflict or a better title match moved it. It never
  clears a link just because nothing matched it: on 2026-10-01 that would have removed 561 correct
  links (localised titles such as "Wipeout 2097" on Wipeout XL, consoles whose platform mapping
  changed, sets waiting in a conflict) next to 78 stale ones. A match counts as ambiguous when the two best fuzzysort scores
  differ by less than `RA_AMBIGUITY_GAP` (0.05): about 570 of the 10,021 RA games that matched on
  2026-09-30.
- **RA candidates come only from platforms whose `raId` is the set's console, so a platform the
  name matcher misses hides all its games.** `matchConsolesToPlatforms` needs an exact shared name
  segment, and IGDB names regional and revision variants differently ("Family Computer" against RA's
  "NES/Famicom", "MSX2", "WonderSwan Color", "Pokémon mini"); Akira on the Famicom never reached its
  RA conflict. Map such a platform in `RA_CONSOLE_BY_PLATFORM_SLUG` (`constants/sync.ts`) instead of
  loosening the matcher, then run `POST /ra/sync` or wait for the nightly run.
- **RetroAchievements data is never stored in collections of its own; it lives on the records
  that use it.** The sync downloads RA's consoles and game lists on every run, matches them in
  memory, writes `raId` into `platforms` and the set's `consoleName`, `imageIcon` (absolute URL)
  and `numAchievements` into each game's `retroachievements` entry. A set that matched nothing is
  not kept. An ambiguous set has no game to live on, so its RA record is snapshotted into the
  conflict's `externalData`, and the RA handler's `describe`, `rematch` and `apply` read that
  snapshot instead of asking RA again; each run refreshes the snapshot of every RA set that has a
  conflict. A link added by hand (a content request) has only `gameId` and `consoleId` until the
  next sync fills in the rest, so the web must render an entry without them.
- **A failed HLTB search is never "not on HLTB".** `howlongtobeat-ts` answers `success: false`
  when the request fails, and `HltbService.search` throws `HltbSearchFailedError` for it: the game
  is counted as failed, keeps its data and gets no `hltbNotFoundAt`, and a run stops after
  `HLTB_MAX_CONSECUTIVE_FAILURES` failures in a row. Treating a failure as an empty result marked
  about 60,000 games "not found" between 2026-08-30 and 2026-10-04 (two in three of them were on
  HLTB), hid them from every sync for the 90-day retry window, wiped the times of games that already
  had them and produced no conflicts at all. A search that succeeds with no results does not clear
  stored times either; only a non-empty result with no acceptable entry does.
- **HLTB titles compare with Roman numerals as digits and against the entry's alias too**
  (`normalizeHltbTitle`, `evaluateEntry`), so "Baldur's Gate III" meets HLTB's "Baldur's Gate 3".
  Single-letter numerals (I, V, X) stay words — "Mega Man X" is not "Mega Man 10". Every
  strong-title candidate the rules could not accept goes to the conflict, a different release year
  included; the year vetoes only the automatic match.
- **An id set by hand ends the source's open conflicts for that game, never its decided ones.**
  `POST /hltb/games/parse?hltbId`, `POST /vndb/games/parse?vnId` and `POST /ra/games/parse?raId`
  call `ConflictsService.removeForGame`: it deletes the conflict of the linked id itself and every
  pending, undecided conflict that lists the game as a candidate. A decided conflict for another id
  stays, because deleting it drops the admin's decision and the next sync re-matches that id. RA
  keeps the pinned conflict of the linked set (`keepExternalIds`): the pin is what stops the nightly
  run from removing the link, and `matchGames` keeps a pinned set on its game even when the set's
  console is not downloaded.
- **A RetroAchievements account is connected only through the motto check, never by typing a
  name.** RA has no OAuth for third parties yet, so `POST /user/ra/connect` stores a pending
  `mooncellar-…` code (30 minutes), the user puts it into their RA motto, and `POST /user/ra/verify`
  reads the motto with `getUserProfile` before saving `raUsername`, `raUlid`, `raUserPic` and
  `raVerifiedAt`. The old `PATCH /user/ra/:userId/:raUserName` had no guard and accepted any name,
  so anyone could show someone else's awards. RA usernames can change since 2025: look users up by
  `raUlid` (the API accepts it wherever it takes a username), as the nightly awards refresh does.
  One RA account belongs to one verified MoonCellar user. `POST /user/ra/sync` reloads the awards
  on demand, at most once a minute per user (`raSyncedAt`); the nightly run sets `raSyncedAt` too.
- **RA awards become playthroughs only for a user who turned on `settings.raSyncPlaythroughs`,
  and only through `RaPlaythroughsService.sync`.** It reads the stored `raAwards` (no RA call), so it
  runs after verify, after `POST /user/ra/sync`, in the nightly awards refresh and from
  `POST /user/ra/playthroughs/sync` when the toggle is switched on. Mastery or Completion makes a
  `completed` playthrough with `isMastered`, Game Beaten a plain `completed` one, dated by the
  award. A game with any playthrough the user made is never touched; an automatic playthrough
  carries `raGameId`, is only ever upgraded to mastered, and writes no user log, so a first import
  of dozens of awards does not flood the feed. Deleting it adds the set to `raIgnoredSets`, which
  stops the next sync from creating it again.
- **One RA award stands for one game, even when its set is linked to several.** 32 sets belong to
  more than one catalogue game (multi-match, or two IGDB entries of one release such as the 1988
  and the 1992 Snatcher), and reading every linked game showed one award twice on the profile and
  would have created two playthroughs. `pickGamesForSets` (`ra-playthroughs.service.ts`) gives each
  set to the game the user has a playthrough of, then the one they rated, then the most rated one;
  both `getUserGames` and `RaPlaythroughsService.sync` go through it.
- **An RA link written outside the sync must be pinned with `ConflictsService.pin`, or the next
  nightly run removes it.** Approving a request with RA ids does this: `pin` upserts a resolved
  `ra` conflict and adds the game to its `winners`, which `matchGames` then keeps.
- **A conflict stores every game it links in `winners`; `winner` is the first of them.** Only a
  handler with `isMultiMatch` (RA) accepts `gameIds` with several games — one RA achievement set
  often covers two games ("Pokémon HeartGold | SoulSilver"), and with one winner the second game
  never got its set. Other sources answer 400, since a VNDB or IGDB entry is one game. Records
  decided before `winners` existed carry only `winner`; read them through `winnerIds`. An RA
  candidate also stores `matchedTitle`, the part of a `|` title it matched, so equal scores on two
  different games read as two different titles rather than a broken scorer.
- **The matcher lives in `games/matching`, and a profile, not the caller, decides the rules.**
  `resolveMatch` is the former VNDB scoring unchanged, and the snapshot spec
  `vndb-match.characterization.spec.ts` pins it. A new source adds a profile. Change VNDB
  behaviour only on purpose: a changed snapshot is a behaviour change.
- **Every RA link set by hand is pinned with `conflicts.pin("ra", …)`: "Link RetroAchievements by
  id", an approved content request, and `GamesService.addGame` for a game created with
  `retroachievements`.** The nightly RA sync matches each set by title and pulls it off every game
  it did not match, so an unpinned set on a game named or filed differently from the RA title
  silently disappears the next morning.

## AI drafts

- **An AI draft runs unattended, so its prompt must forbid questions and its schema must let the
  model say "not found".** `research` returns whatever strict JSON the model fills; with no field
  for failure, a model that could not identify "SUCCUBUS T.G.D" put "Please provide a link…" into
  the character list, and the run spawned a draft for a "character" named "Clarification /
  Request". Keep `identified` on the character schema and `game` on the list schema, and turn a
  negative answer into a failed run whose error says what to change in the query.
- **A link the server cannot fetch is described before the model starts, never left to
  `fetch_page`.** `describeLink` turns a catalogue link (from our database) and a
  `retroachievements.org/game/<id>` link (from the RA Web API, `getGameExtended`) into facts
  appended to the query. RetroAchievements answers 403 to every server-side page fetch, so a draft
  started from an RA link knew nothing but the id. `/Images/000002.png` is RA's "no box art"
  placeholder and is dropped. A game draft from an RA link also carries the set in
  `retroachievements`, built by `toRaSetEntry` like every other RA link.
- **A search answered by the OpenAI fallback is a success, even though its text quotes the SearXNG
  failure.** `searchWebWithFallback` prefixes the answer with `OPENAI_SEARCH_PREFIX` and the
  reason, which contains `SEARCH_ENGINES_UNAVAILABLE`; the abort checks in `research` skip such
  outputs. Matching the phrase anywhere failed every draft with "rate-limited or ask for a
  CAPTCHA" while the fallback had already returned results.

## VNDB

- **`compareDescriptions` must drop the words of both titles before measuring overlap.** A game
  and a VN with the same name share those words in almost every description, and the 0.05
  threshold then reads as "descriptions match" — that is how a fan-made "Mass Effect 3" VN by
  sqbr was linked to BioWare's shooter with no company in common. It also needs at least
  `MIN_SHARED_DESCRIPTION_TOKENS` (2) shared words: the overlap divides by the shorter
  description, so one common word ("high") passed the threshold for "Up & Down".
- **A title key that several candidate games share is not distinctive.** `resolveMatch` adds
  those keys to `sharedTitles`; otherwise one of three games named "Up & Down" took the full
  distinctive-title score.
- **A candidate with an incompatible IGDB genre and no Visual Novel genre (`breakdown.genre < 0`)
  is never auto-matched; it goes to review as `genre-mismatch`.** A unique title plus a close
  date outweigh the genre penalty in the score, so without the veto a platformer or an RTS with
  the same name as a VN was linked on its own. Existing links are not re-scored.
- **Only ids of the form `v<digits>` may reach `getLastVnId`.** A game carrying `vndb.vnId: ""`
  made `$toInt` fail with `Failed to parse number ''`, and every daily sync died on its first
  step.
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
- **Code that reads a VNDB field must add it to that request's `fields` string.** VNDB returns
  only the fields asked for, while `IVndbCharacter`, `IVndbNovel` and the rest declare every
  field, so a missing one type-checks and reads as `undefined` at runtime. `vns.spoiler` was
  read without being requested, and every character's `vndb.spoilerVns` came out empty — no
  spoiler character was ever hidden.
- **A VNDB request that filters by several ids must pass `results`.** VNDB returns 10 items by
  default and reports the rest only through `more: true`; the detail request in `getVnMatches`
  once ran without it and silently processed 10 of every 100 VNs on a page, with no error.
