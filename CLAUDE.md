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

- **Everything written into this repository is English.** Code and identifiers, commit
  messages, every `CLAUDE.md`, everything under `docs/` — including the copy inside
  `docs/mockups/*.html` — and the user-facing strings the apps ship.
- A mockup's headings, labels and placeholder text are UI copy for an English-language
  product. Written in another language they cannot be lifted into a real screen, and the
  mockup stops being a specification of what to build.
- The conversation with whoever asked for the work happens in whatever language they use;
  that never reaches a file.

## Skills

- **Skills resolve from the monorepo root, so every skill is available both from the root and
  from inside a workspace** (`apps/web`, `apps/api`, `packages/schemas`) — do not copy one into
  a workspace to make it visible there. A skill that must apply to a single workspace only goes
  in `apps/<app>/.claude/skills/` and is then addressed with its directory prefix
  (`apps/web:<name>`).
- The checked-in skills live once in `.agents/skills/<name>/` and reach Claude Code through the
  symlinks in `.claude/skills/`, with their origin recorded in `skills-lock.json`. Install new
  ones into `.agents/skills` and symlink them, so the lockfile and any other agent tooling keep
  seeing the same single copy.

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
- **The root `dev` script must launch each app with its own `bun --filter` call, never
  `bun --filter '*' dev`.** `apps/api` has no `dev` script and the glob skips it in silence,
  so `dev:api` calls its `start:dev` by name. `build` and `lint` may keep `--filter '*'`,
  because those scripts terminate and the dependency ordering is what we want there.
- **`apps/api` has no compiled output: Bun executes `src/main.ts` in development and in the
  container, and its `build` script type-checks and boot-checks instead of compiling.**
  Never run the API with Node (`node dist/main`, `nest start`): `@mooncellar/schemas`
  resolves to TypeScript source, tsc does not compile a dependency, and Node dies at boot
  with `ERR_MODULE_NOT_FOUND` on the package's first extensionless import. The API-side rules
  that follow from Bun are in `apps/api/CLAUDE.md`.
- **`apps/web/next.config.mjs` points `turbopack.root` and `outputFileTracingRoot` at
  the monorepo root.** Pinning them to the app directory puts `packages/` outside the
  project root and imports from the shared package stop resolving.
- Both Dockerfiles build with the repository root as context and copy every workspace
  manifest before `bun install --frozen-lockfile`; a partial copy fails the frozen
  lockfile check.

## Frontend architecture

- **`apps/web` is Feature-Sliced Design and every component belongs to a layer** —
  `app → pages → widgets → features → entities → shared`, all under `src/lib`. Nothing lives
  next to the page that renders it: a page composes widgets, a widget composes features and
  entities, and imports only ever point down that list. How to choose the layer, and the
  public-API and naming rules that go with it, are in
  [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md).

## Zod schemas

- Request and response shapes live once in `packages/schemas` and are imported as
  `@mooncellar/schemas` by both apps. There are no copies to keep in sync any more.
- **The package ships TypeScript source: `main` and `types` point at `src/index.ts`, and
  there is no build or watcher.** Each consumer compiles it itself — Bun inside the API,
  Turbopack for Next (it transpiles workspace packages on its own, so `transpilePackages`
  stays empty), ts-jest in the API's tests. This holds only while the API runs on Bun (see
  Monorepo). The measured alternatives, including the compiled CommonJS package this
  replaced, are in `docs/schemas-package.md`.
- `zod` is a peer dependency pinned through the root `catalog`. A second copy anywhere
  in the tree silently breaks type inference across the package boundary.
- `igdb.schema.ts` stays in `apps/web`: it describes an upstream API the frontend reads
  directly, not the contract between the apps.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
