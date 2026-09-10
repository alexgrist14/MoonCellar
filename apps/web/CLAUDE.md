# MoonCellar frontend (apps/web)

Rules that apply to the Next.js app. Repository-wide rules live in the root
[`CLAUDE.md`](../../CLAUDE.md).

## Styling

- Only use the global CSS variables defined in `:root` (see `src/lib/app/styles/vars/`) for colors, borders, padding, radius, gap, etc. — never hardcode raw values (hex colors, px, etc.) for anything already covered by a `:root` variable.
- If a new value is needed that isn't covered by an existing `:root` variable, add it as a new CSS variable in `:root` (in the relevant file under `src/lib/app/styles/vars/`) instead of hardcoding it inline.
- **A CSS custom property that derives from other custom properties must be declared on the same element whose values it reads.** `var()` inside a custom property is substituted where the property is *declared*, not where it is used, so a value computed in `:root` freezes the root defaults and ignores any modifier class further down. `--page-height-available` is declared on `.container` for this reason — declaring it in `:root` silently ignored `.container_bottomBar`.
- For text colour use the semantic tokens, never a raw `--color-neutral-*`: `--color-text-primary` (headings and main copy), `--color-text-secondary` (body text, intro paragraphs), `--color-text-muted` (captions, notes, metadata, breadcrumbs). Picking neutrals by hand is how text ends up unreadable on a `Box` over `BGImage` — the muted step is deliberately the lightest one that still reads as secondary.

## Rich text

- **User-written HTML renders only through the shared `RichText`** (`shared/ui/RichText`), never
  through `dangerouslySetInnerHTML`. It wraps `Interweave`, which parses the markup into React
  elements and drops `script`/`iframe` outright — a second line of defence behind the API's
  `sanitizeRichText`. Both places that show a playthrough comment (the profile's playthrough list
  and the activity log) go through it, which is what keeps their formatting identical.
- **The look of rendered rich text is defined once, in the `richText` mixin** (`_mixins.scss`),
  and consumed by `RichText` and by `RichEditor`'s content area, so the editor shows what the
  reader gets. Block spacing comes from `--rich-text-gap`. The mixin's `img { max-width: 100% }`
  is load-bearing: without it a comment image renders at natural size and blows the activity
  card open to the width of the upload.
- **A rich-text container must restate `font-size` on its own `p`.** `root.scss` declares a bare
  `p { font-size: 14px }`, and an explicit declaration beats an inherited one whatever the
  specificity, so a size set on the wrapper silently does nothing to paragraphs — the `richText`
  mixin sets `p { font-size: inherit; line-height: inherit }` for exactly this reason.
- **Never collapse `<br>` with `br + br`.** The adjacent-sibling combinator ignores text nodes,
  so in `Status<br/>Console<br/>Date<br/>` every `br` counts as the next one's sibling and the
  rule hides all but the first — the whole activity feed collapsed into
  `3DO Interactive MultiplayerDate: 06.09.2026Time: 5h`. Log rows are stored HTML snapshots
  written at action time, so a rule like this breaks every historical entry at once and no
  amount of re-saving fixes them.
- **Log text built by the API must keep block-level content out of `<span>`.** A `<p>` or `<img>`
  inside a span is invalid nesting and the parser hoists it out, which is how the activity feed
  ended up with the comment escaping its card. `getPlaythroughDetailsText` wraps the small
  metadata in a `div` and emits the comment as its own sibling block, so the comment renders at
  the shared rich-text size rather than inheriting the 12px metadata size.

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
  alternatives and their trade-offs are in [`docs/rounded-tiles.md`](../../docs/rounded-tiles.md),
  which also records how the rails fade their cut edges and why scroll snapping was rolled back.

## Server rendering and SEO

The site's value in search is its 10 000 game pages, so **every change must keep page content
in the server-rendered HTML**. See [`docs/seo.md`](../../docs/seo.md) for the full picture. The rules that broke it
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
- **A failed fetch in `generateMetadata` must never return `robots: noindex`.** The page
  component still renders, so the response stays 200 with real content under a "Page not found"
  head, and ISR caches that mix — the symptom is `<title>Page not found | MoonCellar</title>` on
  a game page that loads perfectly for a human, invisible until someone checks the HTML. Return
  neutral metadata on failure and leave the 404 to the page component, which calls `notFound()`
  and lets Next add the `noindex` itself.
- **`fetchOrNull` maps only 404 to `null`.** A 400 from the API is a contract violation, not a
  missing record — `by-slug` answers 400 when the `slug` query param is absent, and treating that
  as "not found" noindexed the whole catalogue. A route whose 404 really does come from a
  request-shape rule must check that shape itself before calling the API: `/user/[name]` validates
  the name with `GetUserByStringSchema` (an email, or 3–15 chars of `[a-zA-Z0-9_]`) so an
  impossible username is a 404 instead of a 500.
- **Purge a poisoned ISR entry with `POST /api/revalidate`** — header `x-revalidate-secret`
  matching `REVALIDATE_SECRET`, body `{"slugs": [...]}` (max 200). `revalidatePath` inside a Route
  Handler only *marks* the path; the re-render happens on the next visit, so request each page
  once afterwards and check its `<title>`.
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

## Mockups

Design proposals are built as standalone HTML in `docs/mockups/`, not as throwaway files
outside the repository. The full reference — palette roles, scales, what a mockup must respect
to be buildable — is [`docs/design-system.md`](../../docs/design-system.md). The rules that
break silently when ignored:

- **A mockup never restates a token.** It uses `var(--color-bg-primary)`, `var(--radius-x5)`,
  `var(--duration-fast)` directly. Copying a hex into a mockup is how a proposal ends up
  showing an accent the site stopped using six months ago, and nobody notices until it ships.
- **The token block is generated, not written.** `bun --filter web sync:tokens` reads
  `@forward "./vars/*"` out of `root.scss`, lifts each `:root` block, and injects the result
  between `/* mooncellar-tokens:start */` and `/* mooncellar-tokens:end */` in every
  `docs/mockups/*.html` plus `docs/design-tokens.css`. Edits inside those markers are
  overwritten on the next run. The flow is one-directional: SCSS is the source.
- **Start from `docs/mockups/_template.html`,** which already carries the markers, the
  `--mock-` prefix convention and the font substitution note. A file without both markers is
  reported as `no-markers` and skipped — the sync stays silent about it otherwise, so a
  hand-rolled mockup quietly stops tracking the design system.
- **Prefix anything the mockup invents with `--mock-`.** A name without the prefix came from
  the site; a name with it exists only in the proposal and is the list of things to promote
  into `vars/` if the design ships.
- **`bun --filter web check:tokens` is the same read, exit 1 when stale.** Run it after
  touching `vars/` — a token change that does not reach the mockups makes every open proposal
  wrong.
- **A mockup is named for its subject, never for a task number.** Ticket numbering lives in an
  external tracker and is meaningless to anyone reading the file a year later — `editor.html`
  with an eyebrow reading `MoonCellar · rich text editor`, not `task 7`. The filename, the
  `<title>` and the eyebrow all name the thing being designed.
- **The licensed faces cannot travel.** ApercuPro and Pentagra are local files, and a published
  mockup may only pull fonts from Google Fonts. Substitute Hanken Grotesk and say so on the
  page, or the mockup reads as a typography proposal it isn't.

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


<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->
