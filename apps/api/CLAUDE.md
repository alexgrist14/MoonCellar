# MoonCellar API (apps/api)

Rules that apply to the NestJS service. Repository-wide rules live in the root
[`CLAUDE.md`](../../CLAUDE.md).

## Imports

- **Every import inside `src/` must be relative — never the non-relative `src/...` form.**
  That form resolves only through `baseUrl`, and it survives into the compiled output unless
  the Nest CLI path transformer rewrites it. The hook ran on a developer machine and did not
  run inside the container image, so `dist` shipped `require("src/module/user/schemas/user.schema")`;
  Bun resolved that to the TypeScript source instead of `dist`, and the service died at boot
  with `SyntaxError: Export named 'IUserSettings' not found in module
  '/app/packages/schemas/dist/index.js'` — a type-only export that exists in the `.ts` file but
  not in compiled JavaScript. The old webpack build hid this by bundling everything.
- Check with `grep -r 'require("src/' dist` after a build: it must print nothing.

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
