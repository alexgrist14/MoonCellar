# MoonCellar

## Keeping this file current

**When a non-obvious constraint costs real debugging time, add it here as a rule before moving
on.** Most sections below exist because something silently broke and the cause was not visible
in the code that broke.

What belongs here: a constraint whose violation produces a bug you cannot see by reading the
diff — framework behaviour that contradicts the obvious reading, a shared component that only
works in one context, an ordering requirement, a value that must stay in sync with something
in another file or repository.

Write it as a rule, not as history: what to do, and one sentence on why. A rule without its
reason gets worked around the next time it is inconvenient. Name the concrete symptom where
one exists — a status code, an error message, a wrong number.

What does not belong here: anything the code already states plainly, one-off fixes, changelog
entries, or a summary of work done. Those go in commit messages or `docs/`.

## Package manager

This project uses **bun** exclusively. Using `npm` is forbidden.

- Install dependencies with `bun install` (never `npm install`).
- Add/remove packages with `bun add` / `bun remove`.
- Run scripts with `bun run <script>` (or `bunx` for one-off binaries).
- Do not create or commit `package-lock.json` — only `bun.lock`/`bun.lockb` is allowed.

## Code generation

- Do not add comments when generating or modifying code.

## Language

- This CLAUDE.md file must be written in English only.

## User settings

- **`user.settings` is a Mongoose `Object` (Mixed) field, so a partial update must merge, not
  assign.** `updateSettings` takes a partial payload and spreads it over the stored object
  (with the schema defaults underneath, for accounts created before a key existed), then calls
  `markModified("settings")`. Assigning only the changed key wipes the rest.
- The background dim lives there as `bgOpacity` (0–1, default `DEFAULT_BG_OPACITY` in the
  shared user schema), not in the client's persisted `settings` store — that store keeps only
  `bgOpacityPreview`, a non-persisted override so the slider previews live before Save.

## Monorepo

- Three workspaces: `apps/web` (Next.js), `apps/api` (NestJS) and
  `packages/schemas` (`@mooncellar/schemas`). Install and run everything from the root
  with `bun --filter <workspace> <script>` — never `cd` into an app to install, the
  lockfile is shared.
- **The root `dev` script must launch each workspace with its own `bun --filter` call, never
  `bun --filter '*' dev`.** `bun --filter` runs the selected scripts in workspace dependency
  order and waits for a dependency's script to exit first; `@mooncellar/schemas`'s `dev` is
  `tsc --watch`, which never exits, so `web dev` is never spawned at all — the terminal just
  sits on the tsc watch banner with no Next.js output. `build` may keep `--filter '*'`,
  because build scripts terminate and the ordering is what we want there.
- **`nest build` must stay on tsc (`"webpack": false` in `apps/api/nest-cli.json`).**
  With hoisted dependencies webpack-node-externals no longer recognises
  `node_modules` and starts bundling NestJS itself, which dies on an optional
  `@fastify/static` loader inside `@nestjs/serve-static`.
- **`apps/api/tsconfig.build.json` must keep `rootDir: "src"`, `include: ["src"]` and
  `tsBuildInfoFile` inside `dist`.** Without the first two, tsc takes the common root of
  every compiled file and the entry point moves to `dist/src/main.js`, so
  `start:prod` and the container `CMD` stop finding it. Without the third,
  `deleteOutDir` wipes `dist` while the build info survives, and the next build emits
  declarations only — a silent, empty-looking build that exits 0.
- **`apps/web/next.config.mjs` points `turbopack.root` and `outputFileTracingRoot` at
  the monorepo root.** Pinning them to the app directory puts `packages/` outside the
  project root and imports from the shared package stop resolving.
- Both Dockerfiles build with the repository root as context and copy every workspace
  manifest before `bun install --frozen-lockfile`; a partial copy fails the frozen
  lockfile check.

## Zod schemas

- Request and response shapes live once in `packages/schemas` and are imported as
  `@mooncellar/schemas` by both apps. There are no copies to keep in sync any more.
- The package compiles to CommonJS with declarations. Do not import its `src` directly
  and do not add an ESM build: Nest resolves it through `require`, and two module
  instances would break `instanceof` and zod's inferred identities.
- `zod` is a peer dependency pinned through the root `catalog`. A second copy anywhere
  in the tree silently breaks type inference across the package boundary.
- `igdb.schema.ts` stays in `apps/web`: it describes an upstream API the frontend reads
  directly, not the contract between the apps.
