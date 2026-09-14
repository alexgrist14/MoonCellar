# Why `@mooncellar/schemas` is a compiled package

The zod schemas shared by `apps/web` and `apps/api` live in their own workspace package, and that
package is compiled to `dist` instead of being imported as TypeScript source. That is why
`bun run dev` runs a third watcher next to the two apps. This document explains what forces each
part of that setup, what happens with each alternative, and what it would take to drop the build.

Every behaviour quoted below was reproduced on 2026-09-14 with TypeScript 5.9.3, Node 26.8.1,
Bun 1.4.2 and zod 4.4.3, in a minimal workspace laid out like this repository — see
[Reproducing](#reproducing).

## The schemas are code, not types

A zod schema is an object built at runtime: `z.object(...)` constructs a validator, and
`.default(DEFAULT_BG_OPACITY)` carries a value into it. Both apps execute them.

- `apps/api` registers `ZodValidationPipe` globally (`src/app.module.ts`), turns schemas into DTOs
  with `createZodDto`, and generates the OpenAPI document from them.
- `apps/web` parses API responses and validates forms with them.

The package is imported from 38 files in `apps/api/src` and 85 in `apps/web/src`. A package that
shipped only declarations, or imports written as `import type`, would type-check and then fail the
first time a request is validated. Every consumer needs executable JavaScript.

## Why a separate package

Until commit `c2a0dbf4` (2026-09-09) the 13 schema files existed twice, byte for byte, in
`apps/web/src/lib/shared/lib/schemas/` and `apps/api/src/shared/zod/schemas/`, and
`apps/api/scripts/check-schema-parity.ts` compared them. Every change had to be made in both places;
the script only noticed when one of them was forgotten. Moving the files into `packages/schemas`
left one definition and deleted the script.

`igdb.schema.ts` stayed in `apps/web`: it describes the upstream IGDB API, which only the frontend
reads.

## Why it ships compiled CommonJS

The requirement comes from the API, which is compiled by tsc and executed from `dist`.

| Where | Compiled by | Executed by | Needs from the package |
|---|---|---|---|
| `apps/api`, local dev | `nest start --watch` (tsc, CommonJS) | Node — `nest` spawns `node dist/main` | JavaScript `require` can load, plus types |
| `apps/api`, container | `nest build` (tsc, CommonJS) | Bun — the `oven/bun` image has no Node; its `node` is a symlink to `bun` | the same |
| `apps/web` | Next.js / Turbopack | Node and the browser | anything a bundler can read |

tsc compiles the API, not its dependencies. Whatever `require("@mooncellar/schemas")` resolves to
must already be JavaScript, and `"main": "./dist/index.js"` is what provides it.

- **CommonJS**, because the API is CommonJS. With both sides on one module format the process loads
  a single copy of zod: the class a schema from the package was built with is the same object as
  `z.ZodObject` inside the API. Alternative 5 shows what happens otherwise.
- **Declarations**, so both apps type-check against the package without pulling its source into
  their own compilation.

## Why dev runs a third process

- Both apps read `dist`, so something has to rebuild it whenever `src` changes. That is
  `dev:schemas` (`tsc --watch`).
- `bun run dev` builds the package once before starting the watchers. On a fresh checkout there is
  no `dist`, and both apps fail to resolve the import.
- The watcher gets its own `bun --filter` call and is never part of `bun --filter '*' dev` — the
  root `CLAUDE.md` explains why.

## Alternatives

| # | Alternative | Outcome | Verdict |
|---|---|---|---|
| 1 | Types only (`import type`, declarations-only package) | The schemas run at request time | Not possible |
| 2 | A copy in each app plus a parity script | The setup before 2026-09-09 | Replaced |
| 3 | Shared folder through a `paths` alias | `TS6059`, or a moved entry point and `Cannot find module` | Rejected |
| 4 | Source-only package, no build | tsc exits 0 without compiling it; Node crashes at boot | Rejected |
| 5 | Source-only package with `.ts` import extensions | Runs on Node, but loads zod twice | Rejected |
| 6 | ESM or dual CommonJS/ESM build | No consumer needs it | Unnecessary |
| 7 | Nest SWC builder | Not tried | — |
| 8 | Run the API on Bun from source | Works in isolation; the real app is not booted yet | Viable, needs a spike |

### 3. Shared folder through a `paths` alias

With the API's `rootDir: "src"`, tsc refuses a file outside it:

```
error TS6059: File '…/packages/schemas/src/index.ts' is not under 'rootDir' '…/apps/api/src'.
```

Without `rootDir` it compiles, but the output takes the common root of every file —
`dist/apps/api/src/main.js` and `dist/packages/schemas/src/index.js` — so `start:prod` and the
container stop finding the entry point. tsc does not rewrite the alias either, and the compiled API
fails with `Error: Cannot find module '@mooncellar/schemas'`.

### 4. Source-only package, no build

Point `main` and `types` at `./src/index.ts` and delete the build scripts.

- **`apps/web` would be fine.** Next.js has `transpilePackages` for exactly this case (not tried in
  this repository).
- **`apps/api` compiles with exit code 0** and emits only its own files, leaving
  `require("@mooncellar/schemas")` as it is. tsc treats a package reached through `node_modules` as
  an external library even when the symlink points back into the workspace: it neither compiles it
  nor applies `rootDir` to it. Nothing warns.
- **At boot, Node 26 strips the types from `src/index.ts`** and fails on its first relative import,
  because Node does not add file extensions:

  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/packages/schemas/src/user.schema'
  imported from …/packages/schemas/src/index.ts
  ```

### 5. Source-only package with `.ts` import extensions

Writing the imports as `./user.schema.ts` gets past alternative 4 on Node 26, at a cost.

- The API's tsconfig needs `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`.
  Without them the build fails inside the package with
  `error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.`
- Node loads the package as an ES module (warning `MODULE_TYPELESS_PACKAGE_JSON`) while the API is
  CommonJS, so zod is resolved twice: through its `import` condition (`index.js`) for the package and
  its `require` condition (`index.cjs`) for the API. The package's `z.ZodObject` and the API's are
  different classes. `instanceof` still returns `true` in zod 4.4.3 and `globalRegistry` is shared,
  so nothing fails loudly — the second copy surfaces only when something relies on identity.
- Node refuses to strip types under `node_modules`
  (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). This works only because workspace packages are
  symlinks that resolve outside it.
- The container executes the API with Bun, so development and production would load the package
  through different mechanisms.

### 6. ESM or dual build

No consumer needs it: the API is CommonJS and loads the package with `require`, and Next.js bundles
CommonJS without configuration. An ESM-only build puts the API on the path of alternative 5. A dual
build adds a second output that can end up loaded next to the first (the dual package hazard); that
case was not measured separately.

### 7. Nest SWC builder

Not tried. The SWC builder transpiles the files under `sourceRoot` and does not compile dependencies,
so the API would still `require` the package's TypeScript and hit alternative 4 at boot. It would
also add `@swc/cli` and `@swc/core`, which the repository does not use.

### 8. Run the API on Bun from source

The only route found that removes the build instead of moving it somewhere else. Measured in
isolation:

- Bun runs the API entry from TypeScript and follows the workspace symlink into the package source.
- One copy of zod: the package's `z.ZodObject` and the API's are the same class.
- With `emitDecoratorMetadata`, Bun emits the `design:paramtypes` metadata Nest's dependency
  injection reads — a decorated class taking `(dep: Dep, n: number)` yields `[Dep, Number]`.
- `packages/schemas` and `apps/api` both type-check under `--isolatedModules`, so a per-file
  transpiler meets no type-only re-export it cannot erase. That class of error caused the container
  incident recorded in `apps/api/CLAUDE.md` (`Export named 'IUserSettings' not found`).
- Production already executes the API with Bun. Local development is the one running it on Node, so
  the switch would also put dev and production on the same runtime.

Not verified yet: the real application booting on Bun (Mongoose, nestjs-zod, Swagger, Prometheus,
`@nestjs/schedule`, the AWS SDK, the MCP SDK), `bun --watch` restarts, jest through ts-jest against the
package source, and Turbopack reading the source through `transpilePackages`.

The change, in order:

1. Spike: boot the real API with `bun --watch src/main.ts` and exercise it. Stop if it does not come
   up cleanly.
2. `packages/schemas/package.json`: point `main` and `types` at `./src/index.ts`; remove `build`,
   `dev` and `files`; delete `dist` and its `.gitignore` entry.
3. `apps/api/package.json`: `start:dev` becomes `bun --watch src/main.ts`; add a `typecheck` script
   (`tsc --noEmit -p tsconfig.build.json`), because Bun does not check types.
4. `apps/web/next.config.mjs`: add `transpilePackages: ["@mooncellar/schemas"]`.
5. Root `package.json`: drop the schemas build from `dev` and remove `dev:schemas`.
6. Both Dockerfiles: drop `bun --filter '@mooncellar/schemas' build`; the API image runs the source
   with Bun.
7. Revisit the rules that exist only because of `dist`: the `tsconfig.build.json`, `nest-cli.json`
   and schemas rules in the root `CLAUDE.md`, and the "build the schemas first" steps in the README.

## Revisit this when

- The API stops being executed from tsc output. Alternative 8 then applies as described.
- The API becomes an ES module. An ESM build of the package stops being pointless.

## Reproducing

A scratch workspace with the same shape as this repository:

- `packages/schemas/package.json` with `main` and `types` pointing at `src/index.ts`.
- `apps/api/node_modules/@mooncellar/schemas` as a symlink to `packages/schemas`, the way
  `bun install` links workspaces.
- `apps/api/tsconfig.json` carrying the flags of `apps/api/tsconfig.build.json` that matter here:
  `module: CommonJS`, `rootDir: "src"`, `include: ["src"]`.
- Compiled with the repository's `node_modules/.bin/tsc`, then run with `node dist/main.js` and
  `bun src/main.ts`.

The duplicate-zod check runs inside the API, with the package re-exporting its own `z` as
`schemasZod`:

```ts
import { z } from "zod";
import { SettingsSchema, schemasZod } from "@mooncellar/schemas";

console.log(SettingsSchema instanceof z.ZodObject);
console.log(schemasZod.ZodObject === z.ZodObject);
console.log(schemasZod.globalRegistry === z.globalRegistry);
```

Node with alternative 5 prints `true`, `false`, `true`. Bun from source prints `true` three times,
and the current compiled setup compares equal as well.
