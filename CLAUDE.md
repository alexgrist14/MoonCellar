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
- `Box`'s own radius is `var(--radius-x5)`. For structural UI wrapper components rendered directly inside a `Box` (`Button`, `Input`, `Textarea`, `CustomDropdown`, and similar reusable "chrome" primitives — not decorative elements like game covers/posters), the `border-radius` must be exactly one step below its structural parent's on the `--radius-x*` scale (parent `x5` → child `x4` → grandchild `x3`, etc.). This rule applies to structural wrapper nesting only, not to decorative/illustrative radii (e.g. card art, covers), which are a deliberate style choice independent of nesting depth.

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

- Before building a new modal that shows a title plus a list of "row" blocks (an icon/content on one side, text on the other — e.g. `AchievementsModal`, `GamePlaysInfo`), ask the user whether the shared `RowsModal` component (`src/lib/shared/ui/RowsModal`) should be used instead of a bespoke layout. Do not silently assume either way.

## Text truncation

- Never write raw `-webkit-line-clamp`/`-webkit-box-orient`/`line-clamp` rules. Use the shared `lineClamp($count)` mixin from `src/lib/app/styles/_mixins.scss` (available globally, no import needed) for any multi-line text truncation, passing the desired line count.

## Scrolling

- Never rely on the browser's default/native scrollbar for a scrollable area. Use the shared `Scrollbar` component from `src/lib/shared/ui/Scrollbar` for any element that needs to scroll (vertically or horizontally via the `isHorizontal` prop).

## Icons

- Do not use the `Icon` component from `@iconify/react` (or any other icon library component).
- Use SVG components from `src/lib/shared/ui/svg` instead. If the needed icon doesn't exist there yet, add a new `Svg*` component to that folder (following the existing components' pattern) and export it from `src/lib/shared/ui/svg/index.ts`.
- New `Svg*` components must be built with the shared `Svg` and `Path` components from `src/lib/shared/ui/svg/Svg/Svg.tsx` — do not write raw `<svg>`/`<path>` tags.

## Language

- This CLAUDE.md file must be written in English only.

## Zod schemas

- The zod schema files in the server repo's `src/shared/zod/schemas/` and
  `MoonCellar/src/lib/shared/lib/schemas/` are byte-identical copies. The server copy is
  canonical — `createZodDto` generates the NestJS DTOs from it.
- The server repo is a sibling directory to `MoonCellar`, but its local folder name is not
  guaranteed to be `MoonCellar-Server` — it may be checked out under a different name (e.g.
  `Game-Gauntlet-Server`). Do not assume the name; check the actual sibling directories
  (`ls ..`) before referencing the server path.
- Any change to a schema must be applied to both copies in the same change, byte for byte.
- Verify with `bun run check:schemas`.
- `igdb.schema.ts` is client-only and exempt.
