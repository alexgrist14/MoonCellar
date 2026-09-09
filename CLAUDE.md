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

## Styling

- Only use the global CSS variables defined in `:root` (see `src/lib/app/styles/vars/`) for colors, borders, padding, radius, gap, etc. — never hardcode raw values (hex colors, px, etc.) for anything already covered by a `:root` variable.
- If a new value is needed that isn't covered by an existing `:root` variable, add it as a new CSS variable in `:root` (in the relevant file under `src/lib/app/styles/vars/`) instead of hardcoding it inline.
- **A CSS custom property that derives from other custom properties must be declared on the same element whose values it reads.** `var()` inside a custom property is substituted where the property is *declared*, not where it is used, so a value computed in `:root` freezes the root defaults and ignores any modifier class further down. `--page-height-available` is declared on `.container` for this reason — declaring it in `:root` silently ignored `.container_bottomBar`.
- For text colour use the semantic tokens, never a raw `--color-neutral-*`: `--color-text-primary` (headings and main copy), `--color-text-secondary` (body text, intro paragraphs), `--color-text-muted` (captions, notes, metadata, breadcrumbs). Picking neutrals by hand is how text ends up unreadable on a `Box` over `BGImage` — the muted step is deliberately the lightest one that still reads as secondary.

## Layout

- **Every content block on a page must sit inside the shared `Box` component from `src/lib/shared/ui/Box`** — not only large sections and cards, but small ones too: breadcrumbs, page headings, intro paragraphs, link rows. Nothing renders directly on the page background.
- The reason is `BGImage`: pages render a full-bleed background image behind their content, and only `Box`'s semi-transparent panel keeps text legible over it. Text placed straight on the page background gets washed out by whatever artwork happens to be showing, and the result differs per game/user. If a block feels too small to deserve a panel, group it with the neighbouring block into one `Box` rather than leaving it outside.
- If a `Box` instance needs a different visual appearance, do it through `Box`'s own props (`className`, `classNameContent`, `wrapperStyle`, `templateStyle`, `contentStyle`, `isWithoutBorder`, `isWithBlur`, etc.) — never by overriding `Box`'s internal styles from outside or duplicating its markup/styles in a custom wrapper.
- **A percentage `max-height` only works if every ancestor up the chain has a definite height.**
  A grid item under `align-items: center` is content-sized, and `Box` is `height: fit-content`
  at both its wrapper and template level, so `contentStyle={{ maxHeight: "100%" }}` silently
  does nothing and the panel overflows the screen. Give the cell `align-self: stretch` plus
  `min-height: 0`, and pass `wrapperStyle`/`templateStyle` with `minHeight: 0; maxHeight: 100%`
  so the constraint reaches the scrollable content.
- **Clamping `Box`'s height is not the same as clamping its content.** `.template` is a column
  flex container; its child is the resize-observer wrapper (`.template__resizer`), which carries
  `min-height: 0` so it can shrink below its content, and `Scrollbar`'s container gets
  `min-height: 0` too. Without both, `max-height` on `.template` shrinks only the panel's own
  background while the text keeps flowing past the rounded border — the symptom is release
  dates spilling out of the gauntlet winner panel and down the page. Do not remove those two
  `min-height: 0` declarations; the scroll area's height comes from flex shrinking, not from
  the `max-height: 100%` on the content (that percentage resolves against an indefinite box and
  is ignored).
- **A row of equal-height `Box` panels needs `height: auto`, not `height: 100%`.** An explicit
  height on a flex item cancels `align-items: stretch`, and a percentage height resolves against
  an indefinite parent and is dropped — so `height: 100%` on the item produces the opposite of
  what it reads like. `Box` ships `height: fit-content` on both `.wrapper` and `.template`, which
  cancels stretch the same way, so a column of Boxes passes `wrapperStyle={{ height: "auto" }}`
  (the flex line stretches it) *and* `templateStyle={{ height: "100%" }}` (the wrapper now has a
  definite height to resolve against). `.template__resizer` and `.template__content` carry
  `flex-grow: 1` for the last leg; without them only the panel's background grows and
  `justify-content: space-between` inside the content does nothing.
- **A `GamesCards` grid must never leave a ragged last row: its column count has to divide the
  list's page size.** Pass the page size as `limit` (`takeHubGames`, `takeGames`, …) and the
  component snaps each width tier down to the nearest divisor — with 30 games a 4-column tier
  renders 3 columns. Without `limit` the grid falls back to `auto-fill`, which lands on any
  count that fits. The `@container` thresholds in `GamesCards.module.scss` are built from
  `$cardMinWidth`/`$cardsGap`, which duplicate `--games-card-min-width` and `--gap-x2` because a
  container query cannot read a custom property — change one and change the other, or the grid
  switches tiers at the wrong width.

- `Box`'s own radius is `var(--radius-x5)`. For structural UI wrapper components rendered directly inside a `Box` (`Button`, `Input`, `Textarea`, `CustomDropdown`, and similar reusable "chrome" primitives — not decorative elements like game covers/posters), the `border-radius` must be exactly one step below its structural parent's on the `--radius-x*` scale (parent `x5` → child `x4` → grandchild `x3`, etc.). This rule applies to structural wrapper nesting only, not to decorative/illustrative radii (e.g. card art, covers), which are a deliberate style choice independent of nesting depth.

- **A rounded image tile needs the radius on the image too, and its hover ring must be an
  `outline`, not a transparent `border`.** A `border: 2px solid transparent` shrinks the
  content box, so the tile's own `background-color` shows through the border as a light kant
  along the rounded corners; `overflow` alone also leaves a seam there, because the parent's
  clip is a mask while the image keeps square corners. Use `outline: 2px solid transparent`
  with `outline-offset: -2px` (draws inside, changes no geometry) plus `border-radius: inherit`
  on the `img`. The media rails in `Slideshow` and `VideosRow` are built this way; the
  alternatives and their trade-offs are in [`docs/rounded-tiles.md`](./docs/rounded-tiles.md),
  which also records how the rails fade their cut edges and why scroll snapping was rolled back.

## Server rendering and SEO

The site's value in search is its 10 000 game pages, so **every change must keep page content
in the server-rendered HTML**. See `docs/seo.md` for the full picture. The rules that broke it
before:

- **Never gate content on client-only state.** A wrapper that returns `null` until a value set
  in `useEffect` arrives (viewport size, hydration flag) removes the whole subtree from the
  HTML. Render both branches and switch with CSS media queries instead.
- **Never render a list through something that measures the DOM first.** `react-virtualized`'s
  `AutoSizer` returns `null` until it has a size, so the list produces no links on the server.
- **Never call `notFound()` from `generateMetadata`.** With streaming metadata the throw is
  caught below the flushed shell and the response stays 200 (a soft 404). Wrap the lookup in
  `React.cache`, return fallback metadata there, and call `notFound()` only from the page
  component.
- **Do not add a `Suspense` boundary above a page component that can call `notFound()`** — it
  reproduces the same soft 404. Boundaries belong inside the routes that need them
  (`useSearchParams`).
- **Reading `searchParams` in a route disables its cache.** Game pages and hubs are ISR; adding
  a `searchParams` read makes them dynamic again. Note also that `export const revalidate` does
  nothing on a dynamic segment without `generateStaticParams` — the hub and game routes export
  `generateStaticParams() { return []; }` so nothing is prerendered at build time (the build must
  not depend on the API) while the route still opts into caching.
- **`router.refresh()` does not clear the ISR cache.** Game pages are cached for an hour
  (`revalidate = 3600`), and a refresh only drops the client Router Cache — the server answers
  from the same cached entry, so a game edited from the browser keeps showing the old data until
  the hour is up. Any admin mutation made in the browser must call the `revalidateGamePage`
  server action (`entities/game/api/game.actions.ts`) *before* `router.refresh()`, or the refresh
  refills the cache with the stale render. Background jobs on the server deliberately do not
  revalidate: a mass parse would turn every touched page into a cold render.
- **A page-level `openGraph` or `twitter` object replaces the parent's wholesale — it does not
  merge.** A route that declares `openGraph` must restate `siteName`, `type`, `locale` and
  `images`, or it loses them. Do not put `twitter.images` in the root layout: every page without
  its own `twitter` block inherits that image, and `twitter:image` stops following the page's
  own `og:image` (game pages shipped the site banner instead of the cover).
- **Collapse long lists with CSS, never by slicing the array.** The game page carries up to 215
  keyword links; rendering only the first N drops the rest from the HTML. `ExpandableBlock`'s
  `clampHeight` prop hides the overflow with `max-height` while every link stays in the DOM —
  use it (or the `lineClamp` mixin) instead of `items.slice(0, n)`.
- **Never serve image URLs from under `/api`** — `robots.ts` disallows it, so crawlers cannot
  fetch them. The cover proxy lives at `/img/image-proxy` for exactly this reason.

## Server and client components

Shared UI (`Box`, `GamesCards`, `GameCard`, `Pagination`, …) carries no `"use client"`
directive — those components are client-side only because they are imported from client pages.
Importing one directly into a route under `src/app/` makes Next treat it as a server component
and it fails at runtime (`useRef is not a function`). Wrap it in a small `"use client"`
component instead of adding the directive to the shared primitive.

Functions cannot be passed from a server component to a client one. Pass the data a client
component needs to build the value itself (a `basePath` string, not a `getHref` callback).

## Animations

- **Keyframes added to `_animations.scss` are copied into every CSS module.** `next.config.mjs`
  injects `styles/index.scss` into each module through sass `additionalData`, and CSS Modules hash
  `@keyframes` names per file, so every shared keyframe is emitted once per module in the built
  CSS. Keep keyframes used by one component in that component's own `.module.scss`; move them to
  `_animations.scss` only when a second component needs them.
- **An exit animation whose end unmounts the node must never be switched off with `animation:
  none`.** `useDelayedUnmount` drops the node on `animationend`; with no animation the event never
  fires and the block stays on screen forever. Inside the `reducedMotion` mixin set
  `animation-duration: var(--duration-instant)` (1ms) instead of removing the animation.
- Put the animation on the grid cell that already holds the block, never on a new wrapper around
  `Box` — an extra element between the cell and `Box` breaks the definite-height chain that the
  panel's `max-height: 100%` depends on. Animate only `opacity` and `transform`: animating height
  makes `Box`'s `useResizeDetector` fire on every frame.

## Data fetching

- **Never gate a loader on React Query's `isPending`.** A disabled query
  (`enabled: false`, e.g. `useGamesByIdsQuery`'s `ids.length > 0`) never leaves `status:
  "pending"`, so `if (isPending) return <Loader />` renders forever and the empty-state branch
  below it is unreachable — that is how the profile's "List is empty" placeholder disappeared
  behind an endless spinner. Use `isFetching` (or `isLoading`, which is `isPending &&
  isFetching`): both are `false` while a query is disabled and `true` on the first render of an
  enabled one, so nothing flashes before the loader appears.

## Verification

- **Do not reason about pixels — measure them.** `bun run check:layout` drives the installed
  Chrome through `playwright-core` and reports `main.container` height against the viewport at
  three widths, failing when a page marked `mustFit` overflows. Requires a running
  `bun run start`; set `CHROME_PATH` if Chrome is not on the default channel.
- **`curl` cannot see JSON-LD or anything JS injects.** Check structured data with Google's
  Rich Results Test; a "no schema found" conclusion drawn from `curl` is a false finding.
- Before adding a helper, search for an existing one. `getAverageRating` (the combined
  IGDB / HowLongToBeat / user rating) already existed in `src/lib/shared/utils/rating.utils.ts`.

## Modals

- **Modals must not push history entries.** `ModalsConnector` closes every open modal on
  `popstate`, so Back and Forward dismiss the modal *and* still navigate. Pushing an entry per
  modal (so Back only closes it) was tried and rejected: it swallows the Back press, and keeping
  the pushed depth in sync with programmatic closes needs bookkeeping that breaks as soon as
  anything else touches history.

- Before building a new modal that shows a title plus a list of "row" blocks (an icon/content on one side, text on the other — e.g. `AchievementsModal`, `GamePlaysInfo`), ask the user whether the shared `RowsModal` component (`src/lib/shared/ui/RowsModal`) should be used instead of a bespoke layout. Do not silently assume either way.

## Text truncation

- Never write raw `-webkit-line-clamp`/`-webkit-box-orient`/`line-clamp` rules. Use the shared `lineClamp($count)` mixin from `src/lib/app/styles/_mixins.scss` (available globally, no import needed) for any multi-line text truncation, passing the desired line count.

## Date fields

- Never render a native date input (`<input type="date">`). Use the shared `DatePicker`
  (`src/lib/shared/ui/DatePicker`): the browser's own picker paints a dark calendar icon and a
  white popup that ignore the site's dark theme. `DatePicker` takes and emits ISO `yyyy-mm-dd`
  and displays `dd.mm.yyyy` through `commonUtils.formatDate`.
- Its popover renders into `#dropdown-connector` through a portal, so a field inside a modal or
  a clipped panel cannot cut it off. Parse the incoming ISO string by hand (`new Date(y, m - 1,
  d)`), never `new Date("2026-09-20")` — the latter is parsed as UTC midnight and shows the
  previous day in any negative-offset timezone.

## Scrolling

- Never rely on the browser's default/native scrollbar for a scrollable area. Use the shared `Scrollbar` component from `src/lib/shared/ui/Scrollbar` for any element that needs to scroll (vertically or horizontally via the `isHorizontal` prop).
- **Measure the scrollbar track with `offsetWidth`/`offsetHeight`, never `clientWidth`/`clientHeight`.**
  The track carries a 1px border, and the client box excludes it — sizing the thumb from the
  client box leaves it short of the track end by exactly the border width on both axes. The
  thumb's position is a plain proportion: `scrolled / (scrollSize - clientSize)` mapped onto
  `trackSize - thumbSize`, so it reaches both ends exactly.

## Icons

- Do not use the `Icon` component from `@iconify/react` (or any other icon library component).
- Use SVG components from `src/lib/shared/ui/svg` instead. If the needed icon doesn't exist there yet, add a new `Svg*` component to that folder (following the existing components' pattern) and export it from `src/lib/shared/ui/svg/index.ts`.
- New `Svg*` components must be built with the shared `Svg` and `Path` components from `src/lib/shared/ui/svg/Svg/Svg.tsx` — do not write raw `<svg>`/`<path>` tags.

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

## Zod schemas

- The zod schema files in the server repo's `src/shared/zod/schemas/` and
  `MoonCellar/src/lib/shared/lib/schemas/` are byte-identical copies. The server copy is
  canonical — `createZodDto` generates the NestJS DTOs from it.
- The server repo is a sibling directory to `MoonCellar`, but its local folder name is not
  guaranteed to be `MoonCellar-Server` — it may be checked out under a different name (e.g.
  `Game-Gauntlet-Server`). Do not assume the name; check the actual sibling directories
  (`ls ..`) before referencing the server path.
- Any change to a schema must be applied to both copies in the same change, byte for byte.
- A new schema file must also be added to `SCHEMA_FILES` in the server's
  `scripts/check-schema-parity.ts`. The list is hardcoded, so a file missing from it drifts
  silently — the check passes while the two copies diverge.
- Verify with `bun run check:schemas`.
- `igdb.schema.ts` is client-only and exempt.

## CodeGraph across the two repositories

- **`MoonCellar` and the server repo have separate `.codegraph/` indexes, and a query resolves
  against the session's working directory.** Both `.mcp.json` files launch `codegraph serve
  --mcp` with no fixed path, so a session started in the client sees only the client's index.
- **Querying a server symbol from a client session fails silently.** It does not error and does
  not return empty — it returns plausible-looking client files instead. Asking for
  `upsertCharacterFromIgdb linkGameCharacters IGDBService` (all server-only) came back with
  `characters.schema.ts`, `igdb.api.ts` and `GamePage.tsx`, and nothing signalled that all three
  requested symbols were missing.
- **Pass `projectPath` with the absolute path to the other repo** when exploring server code
  from a client session (or `cd` into it first for the CLI). The same query with
  `projectPath: "…/MoonCellar-Server"` returned 80 symbols across 19 files.
- This matters constantly here, because the zod schemas are mirrored across both repos and most
  schema work touches server and client together.
- The `codegraph prompt-hook` in `~/.claude/settings.json` is bound to the session's directory
  the same way, so its auto-injected context describes the session's repo — not necessarily the
  one being edited. Do not read its silence as "nothing relevant exists".
