# Why `@mooncellar/schemas` ships TypeScript source

The zod schemas shared by `apps/web` and `apps/api` live in their own workspace package, and that
package has no build: `main` and `types` point at `src/index.ts`, and every consumer compiles the
source itself. This works because the API runs its own TypeScript on Bun instead of compiled
JavaScript on Node. This document explains what forces each part of that setup, what the API code
has to respect because of Bun, and what happened with every alternative that was tried.

History: commit `c2a0dbf4` (2026-09-09) replaced two copies of the schemas with a package compiled
to CommonJS, which needed a `tsc --watch` next to the two apps. On 2026-09-14 the API moved to Bun
and the package to source. Every behaviour quoted below was reproduced on that date with
TypeScript 5.9.3, Node 26.8.1, Bun 1.4.2, zod 4.4.3, NestJS 11.1.28 and Next.js 16.3.0-preview.6.

## The schemas are code, not types

A zod schema is an object built at runtime: `z.object(...)` constructs a validator, and
`.default(DEFAULT_BG_OPACITY)` carries a value into it. Both apps execute them.

- `apps/api` registers `ZodValidationPipe` globally (`src/app.module.ts`), turns schemas into DTOs
  with `createZodDto`, and generates the OpenAPI document from them.
- `apps/web` parses API responses and validates forms with them.

A package that shipped only declarations, or imports written as `import type`, would type-check
and then fail the first time a request is validated. Every consumer needs executable code.

## Why a separate package

Until `c2a0dbf4` the 13 schema files existed twice, byte for byte, in
`apps/web/src/lib/shared/lib/schemas/` and `apps/api/src/shared/zod/schemas/`, and
`apps/api/scripts/check-schema-parity.ts` compared them. Every change had to be made in both places;
the script only noticed when one of them was forgotten.

`igdb.schema.ts` stayed in `apps/web`: it describes the upstream IGDB API, which only the frontend
reads.

## Who reads the source

| Consumer | How it gets the package | Runtime |
|---|---|---|
| `apps/api`, development | `bun --watch src/main.ts` (`start:dev`) | Bun |
| `apps/api`, container | `bun src/main.ts` (`CMD ["bun", "run", "start"]`) | Bun |
| `apps/api`, type check | `tsc -p tsconfig.build.json`, `module: preserve` | — |
| `apps/api`, tests | jest with ts-jest, compiled to CommonJS | Node |
| `apps/web` | Turbopack, which transpiles workspace packages on its own | Node and the browser |
| `apps/api/mcp/game-adder` | `bun run apps/api/mcp/game-adder/index.ts` | Bun |

Next.js needs no `transpilePackages` entry: its documentation states that Turbopack transpiles
workspace packages automatically under both routers, and `next build` compiles and type-checks the
package source without one.

## Why this depends on Bun

tsc compiles the API but not its dependencies. With `main` on `src`, a Node-run API compiled by tsc
exits the build with code 0, emits `require("@mooncellar/schemas")` unchanged, and dies at boot when
Node strips the types from `src/index.ts` and cannot resolve its first extensionless import:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/packages/schemas/src/user.schema'
imported from …/packages/schemas/src/index.ts
```

Bun follows the workspace symlink into the source, transpiles it, and loads a single copy of zod.
Production already ran on Bun before the switch — the `oven/bun` image has no Node, and its `node`
is a symlink to `bun` — so the change moved local development onto the runtime production uses.

## What Bun requires from the API code

Bun transpiles one file at a time and links imports like ES modules. Three things that tsc and Node
tolerate kill the boot under Bun. Two are caught statically by `apps/api/tsconfig.build.json`, which
type-checks with Bun's semantics (`module: preserve`, `verbatimModuleSyntax`); the third only by
`check:boot`.

### A type named in decorator metadata must be imported with `import type`

Under `emitDecoratorMetadata`, tsc knows `IUserSettings` is an interface and emits `Object`. Bun does
not know, keeps the import for `design:type`, and the link fails:

```
SyntaxError: Export named 'IUserSettings' not found in module '…/packages/schemas/src/index.ts'.
```

The trigger was a decorated property, `@Prop() settings: IUserSettings`, in `user.schema.ts`.
`isolatedModules` reports only decorated signatures (`TS1272`) and passed; `verbatimModuleSyntax`
reports every such import as `TS1484`. The switch marked 107 imports in 36 files with `type`.

### A CommonJS package whose export is a function needs a default import

`import * as cookieParser from "cookie-parser"` gives a namespace object under Bun, and calling it
throws:

```
cookieParser is not a function. (In 'cookieParser()', 'cookieParser' is an instance of Module)
```

The same held for `sanitize-html` in `rich-text.utils.ts`, where it would have failed on the first
sanitised request rather than at boot. With `module: preserve`, tsc reports both calls as `TS2349`.
Namespace imports of packages that export an object (`bcryptjs`, `fuzzysort`) keep working.

### A named import from CommonJS must exist as an own property

mongoose attaches `Connection` to its prototype, so Bun cannot link the named import:

```
SyntaxError: Export named 'Connection' not found in module '…/node_modules/mongoose/index.js'.
```

tsc sees a class in mongoose's types and reports nothing. `mongo-metrics.service.ts` injects it with
`@InjectConnection()`, which supplies the token, so `import type { Connection }` is enough. A scan of
every named value import in `apps/api/src` under Bun found no other case among 27 packages.

`bun --filter api check:boot` exists for this class. It loads `AppModule`, resolves the DI graph in
Nest's preview mode — no provider is instantiated and MongoDB is never contacted — and generates the
OpenAPI document. It runs without any `.env`, and `build` runs it after the type check, so the
container image build stops on it.

## Verification on 2026-09-14

| Check | Result |
|---|---|
| `bun --filter api build` (type check + boot check) | passes; 36 modules, 88 routes, 31 component schemas |
| Boot check with the `Connection` import reverted | fails with the `SyntaxError` above |
| Boot check in a copy without `.env` or environment | passes |
| API jest | 97 of 98; `igdb.service.spec.ts` › "writes normally when the flag is absent" fails on the unchanged code as well |
| `bun --filter @mooncellar/schemas typecheck` and `test` | pass; 5 tests |
| `bun --filter web build` | passes, including its TypeScript step |
| `game-adder` MCP over stdio | answers `initialize`, lists 5 tools |
| `bun install --frozen-lockfile` | lockfile unchanged |

Not verified: the API serving requests against MongoDB and `bun --watch` restarts (MongoDB was not
running), and the container images (no Docker or Podman on the machine).

## Alternatives

| # | Alternative | Outcome | Verdict |
|---|---|---|---|
| 1 | Types only (`import type`, declarations-only package) | The schemas run at request time | Not possible |
| 2 | A copy in each app plus a parity script | The setup before 2026-09-09 | Replaced |
| 3 | Shared folder through a `paths` alias | `TS6059`, or a moved entry point and `Cannot find module` | Rejected |
| 4 | Source-only package, API on Node | tsc exits 0 without compiling it; Node crashes at boot | Rejected |
| 5 | Source with `.ts` import extensions, API on Node as CommonJS | Runs, but loads zod twice | Rejected |
| 6 | Package compiled to CommonJS plus `tsc --watch` | Worked; a third process and a build before first start | Replaced on 2026-09-14 |
| 7 | ESM or dual CommonJS/ESM build of the package | No consumer needs it | Unnecessary |
| 8 | Nest SWC builder | Not tried | — |
| 9 | API as ES modules on Node, package as source | Works after mechanical changes; adds constraints on the schemas | Not chosen |
| 10 | API on Bun, package as source | See above | Chosen |

### 3. Shared folder through a `paths` alias

With `rootDir: "src"` tsc refuses the file (`error TS6059: File '…/packages/schemas/src/index.ts' is
not under 'rootDir'`). Without it the output takes the common root of every file
(`dist/apps/api/src/main.js`), and tsc does not rewrite the alias, so the compiled API fails with
`Error: Cannot find module '@mooncellar/schemas'`.

### 4. Source-only package, API on Node

Described in [Why this depends on Bun](#why-this-depends-on-bun). tsc treats a package reached
through `node_modules` as an external library even when the symlink points back into the workspace:
it neither compiles it nor applies `rootDir` to it, and nothing warns.

### 5. Source with `.ts` import extensions, API on Node as CommonJS

Writing the imports as `./user.schema.ts` gets past alternative 4 on Node 26, at a cost. The API
needs `allowImportingTsExtensions` and `rewriteRelativeImportExtensions` (otherwise `TS5097` inside
the package). Node then loads the package as an ES module while the API is CommonJS, so zod resolves
through both its `import` and `require` conditions: the package's `z.ZodObject` and the API's are
different classes. `instanceof` still returns `true` in zod 4.4.3, so nothing fails loudly. Node also
refuses to strip types under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`); this
works only because workspace packages are symlinks.

### 6. Package compiled to CommonJS plus `tsc --watch`

`main` on `dist/index.js`, declarations next to it, a `dev:schemas` watcher, and a build before
either app could start on a fresh checkout. It kept the API on Node in development while production
already ran Bun. Replaced by 10, which removes the build rather than moving it.

### 7. ESM or dual build

The API loaded the package through `require`, and Next.js bundles CommonJS without configuration. An
ESM-only build puts a Node-run API on the path of alternative 5; a dual build adds a second output
that can load next to the first. Not measured separately.

### 8. Nest SWC builder

Not tried. The SWC builder transpiles files under `sourceRoot` and does not compile dependencies, so
the API would still `require` the package's TypeScript and fail like alternative 4.

### 9. API as ES modules on Node, package as source

Measured on a copy of the API with `"type": "module"` and `module: nodenext`. With the API an ES
module, zod loads once even when the package is TypeScript source. The cost:

- 291 relative imports in 80 files need a `.js` extension (a codemod resolved all of them).
- `cookie-parser` and `sanitize-html` need default imports; `sanitize-html` crashes at module load.
- `import * as fuzzysort` returns `undefined` for `fuzzysort.go` under Node, which tsc does not
  report; it would fail only when a search runs.
- `nestjs-pino/storage` needs `.js`, and `import { Connection } from "mongoose"` fails to link.
- `@retroachievements/api` 2.10.0 ships declarations that do not resolve under `nodenext` (11 type
  errors, runtime unaffected).
- The schemas must become erasable TypeScript for Node's type stripping — `RolesEnum` in
  `role.schema.ts` is an `enum` — and use `.ts` import extensions.
- jest keeps working with ts-jest compiling to CommonJS and a mapper that strips `.js`.

The module graph had no import cycles, so decorator metadata raised no TDZ errors. NestJS 12, whose
packages are ESM-only, keeps CommonJS applications working through `require(esm)`, so it does not
force this either. Not chosen because alternative 10 reaches the same result without the constraints
on the schemas, and puts development on production's runtime.

## Revisit this when

- The API has to run on Node again, for example because a dependency breaks under Bun. Go back to
  alternative 6, or to 9 if the schemas can accept its constraints.
- Bun learns to resolve decorator metadata types across files. The `import type` and namespace rules
  above are Bun-specific.

## Reproducing

The Node experiments used a scratch workspace with the same shape as this repository:
`packages/schemas/package.json` with `main` pointing at `src/index.ts`, and
`apps/api/node_modules/@mooncellar/schemas` symlinked to it the way `bun install` links workspaces,
compiled with the repository's `node_modules/.bin/tsc`. The duplicate-zod check, run inside the API
with the package re-exporting its own `z` as `schemasZod`:

```ts
import { z } from "zod";
import { SettingsSchema, schemasZod } from "@mooncellar/schemas";

console.log(SettingsSchema instanceof z.ZodObject);
console.log(schemasZod.ZodObject === z.ZodObject);
```

Node with alternative 5 prints `true`, `false`. Bun from source, and an ES-module API on Node, print
`true`, `true`.
