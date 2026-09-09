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
