# MoonCellar frontend (apps/web)

Rules that apply to the Next.js app. Repository-wide rules live in the root
[`CLAUDE.md`](../../CLAUDE.md).

## Styling

- Only use the global CSS variables defined in `:root` (see `src/lib/app/styles/vars/`) for colors, borders, padding, radius, gap, etc. — never hardcode raw values (hex colors, px, etc.) for anything already covered by a `:root` variable.
- If a new value is needed that isn't covered by an existing `:root` variable, add it as a new CSS variable in `:root` (in the relevant file under `src/lib/app/styles/vars/`) instead of hardcoding it inline.
- **A CSS custom property that derives from other custom properties must be declared on the same element whose values it reads.** `var()` inside a custom property is substituted where the property is *declared*, not where it is used, so a value computed in `:root` freezes the root defaults and ignores any modifier class further down. `--page-height-available` is declared on `.container` for this reason — declaring it in `:root` silently ignored `.container_bottomBar`.
- **A button's inline padding is always twice its block padding** — the shared `Button` uses
  `var(--padding-x1) var(--padding-x2)`, and any override keeps the 1:2 ratio on the same scale
  (`x2`/`x4`, `x05`/`x1`). The only exception is a button that holds a single icon and nothing
  else, which keeps equal padding. This is the site's button shape; a text button with a 1:3 ratio
  reads as a different control next to its neighbours.
- For text colour use the semantic tokens, never a raw `--color-neutral-*`: `--color-text-primary` (headings and main copy), `--color-text-secondary` (body text, intro paragraphs), `--color-text-muted` (captions, notes, metadata, breadcrumbs). Picking neutrals by hand is how text ends up unreadable on a `Box` over `BGImage` — the muted step is deliberately the lightest one that still reads as secondary.

## Rich text

- **User-written HTML renders only through the shared `RichText`** (`shared/ui/RichText`), never
  through `dangerouslySetInnerHTML`. It wraps `Interweave`, which parses the markup into React
  elements and drops `script`/`iframe` outright — a second line of defence behind the API's
  `sanitizeRichText`. Both places that show a playthrough comment (the profile's playthrough list
  and the activity log) go through it, which is what keeps their formatting identical.
- **The look of rendered rich text is defined once, in the `richText` mixin** (`_mixins.scss`),
  and consumed by `RichText` and by `RichEditor`'s content area, so the editor shows what the
  reader gets. Block spacing comes from `--rich-text-gap`. Images are capped there at
  `min(100%, var(--rich-editor-image-width))`, and no consumer restates the width: while only the
  editor capped it, a review on the game page stretched a screenshot across the whole panel,
  and the profile looked right only because its column happened to be narrow. The `100%` half is
  load-bearing too — without it a comment image renders at natural size and blows the activity
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
- **The emoji picker hides what the browser cannot draw, and its probe must survive canvas
  noise.** `EmojiPicker/emoji.data.ts` draws one probe emoji per Emoji version to a canvas twice,
  in red and in blue: a colour glyph ignores `fillStyle` and both renders match, while a missing
  glyph (an empty box) or a monochrome fallback follows the fill. Brave, Firefox's fingerprinting
  protection and anti-fingerprinting extensions perturb `getImageData`; a probe that counted any
  non-red pixel as colour passed every version under that noise, and users saw empty boxes for
  Emoji 14 while headless Chrome looked correct. Keep the red/blue comparison and its thresholds,
  and draw with the picker's computed `font-family` so the canvas falls back to the same emoji
  font as the buttons. Fully random or blank readback fails every probe and drops to Emoji 5 —
  fewer emoji, never boxes.

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

- **The `/lists` grid has the same container-query duplication as `GamesCards`.**
  `ListsPage.module.scss` copies `--list-card-min-width` and `--gap-x4` into `$listCardMinWidth` and
  `$listCardsGap` for its `@container` thresholds; change the token and the variable together, and
  keep every column count a divisor of `CUSTOM_LISTS_PAGE_SIZE` (24).

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
- **When the tile's content is positioned, put the ring on an `::after` overlay.** `next/image`
  with `fill`, or a grid of positioned cells, paints above its container's outline, so the ring is
  hidden and shows only through the gaps — the list tile's mosaic showed four accent dots on hover
  instead of a frame. Draw it on `&::after` (`position: absolute; inset: 0; z-index: 1;
  border-radius: inherit; pointer-events: none`) with the same inset outline, as `ListCard`,
  `TopFive` and `FavoritesFullPopover` do.

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
- **Never catch inside an `unstable_cache` callback.** Next stores whatever the callback resolves
  to, so a `.catch(() => [])` inside turns a failed request into a legitimate empty result cached
  for the whole `revalidate` window — the home page's "Browse By Platform" block disappeared for
  an hour after a single render during an API outage, with `[]` sitting in the data cache. Let the
  callback throw and fall back at the call site, as `sitemap.ts` does: a thrown error is never
  written to the cache, so the next request retries.
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

- **A server fetch of anything private must forward the request's cookies.** Server-side `agent`
  calls carry no session, and `GET /lists/by-slug` answers 404 for a private list unless the viewer
  is its owner — without forwarding `cookies()` as the `Cookie` header, owners get "Page not found"
  on their own private lists while everyone else sees the correct 404.

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

## Forms

- **A field driven only by `setValue` never recomputes `formState.isValid`.** react-hook-form
  runs its validity pass when a field *registers*; `setValue` without `shouldValidate` does not,
  so a form whose fields are all `setValue`/`watch`-driven keeps the initial `isValid: false`
  after `reset()`, and a `disabled: !isValid` button stays locked on a valid form. The symptom
  was the playthrough modal's Save staying disabled for Wishlist until something was typed into
  the comment — and staying enabled after the text was erased again. Completed, Played and
  Dropped hid it because they render the registered `time` input. Wire custom inputs through
  `Controller` (as `PlaythroughModal`'s `RichEditor` and `GameEditPage`'s fields do) so the
  field registers. Hiding such a field must not unmount it: `{isShown && <Controller />}` drops
  the registration and locks the button again — keep the `Controller` rendered and hide its
  wrapper with a modifier class, as the modal does with the comment for Wishlist.

## Data fetching

- **Never gate a loader on React Query's `isPending`.** A disabled query
  (`enabled: false`, e.g. `useGamesByIdsQuery`'s `ids.length > 0`) never leaves `status:
  "pending"`, so `if (isPending) return <Loader />` renders forever and the empty-state branch
  below it is unreachable — that is how the profile's "List is empty" placeholder disappeared
  behind an endless spinner. Use `isLoading` (`isPending && isFetching`): it is `false` while a
  query is disabled and `true` on the first render of an enabled one, so nothing flashes before
  the loader appears.
- **Never gate a loader that replaces data on `isFetching` either.** It is also `true` during a
  background refetch, so once a query is older than its `staleTime` a remount swaps the cached
  list for the spinner — the `/games` catalogue showed a loader and refetched on every browser
  Back instead of rendering from the cache. Keep `isFetching` for secondary indicators.
- **Page state of a client page that fetches through React Query goes into the URL with
  `window.history.pushState`, not `router.push`.** `router.push` re-runs the route's server
  component, and `useSearchParams` does not change until that server render finishes, so the
  client query never sees the new key in time: `/games` pagination just scrolled to the top and
  swapped the cards later with no loader, even for pages already in the cache. `pushState`
  updates `useSearchParams` immediately without a server request — `GamesPage` pagination and
  `Filters` both go through it.

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

## Auth

- **The auth cookies are `httpOnly` and set by the API, so only an API response can remove
  them.** `deleteCookie` writes `document.cookie`, which cannot touch an `httpOnly` cookie —
  every call on `accessMoonToken`/`refreshMoonToken` is a no-op. A session ends only through
  `POST /auth/:id/logout` or a rejected `POST /auth/refresh-token`, both of which clear the
  cookies in their response.
- **The persisted `auth` store and the cookies can disagree, so the profile trusts the viewer
  only when both do.** `/user/[name]` decodes `accessMoonToken` on the server to decide who is
  viewing, while `agent` sends `x-user-id` from the store. A browser logged out in the store but
  still carrying a live cookie got the owner's profile: `PATCH profile-time` fired on open, log
  deletion was offered, and every such request died with `400 Wrong user` from `UserIdGuard`.
  `UserProfile` accepts the server's `authUserId` only when the store's profile has the same id
  (the server render, which has no store, keeps the cookie's answer), and on disagreement calls
  `refreshAuth`, which either restores the session or gets the stale cookies cleared.

## Sockets

- **Nothing reachable from `shared/api` may import `socket.io-client`.** `shared/api/index.ts`
  re-exports every API module, so an import there lands in almost every client bundle.
  `comments.api.ts` reads the socket id from `shared/socket/socket-id.ts`, which has no
  dependencies; only `shared/socket/comments.socket.ts` loads the client, and only
  `useDiscussionSocket` imports that.
- **The socket opens only from the Discussion tab.** `DiscussionTab` mounts after the tab is first
  opened, so a game page nobody discusses holds no connection. Keep `useDiscussionSocket` out of
  `GamePage` and `GameCommunity`, or every visitor of the 10 000 game pages opens a socket to the
  API.
- **`NEXT_PUBLIC_API_URL` must stay a bare origin.** Socket.IO reads the path of the URL it is
  given as the namespace, so `https://api.mooncellar.space/v1` would ask for namespace
  `/v1/comments` and the connection fails with `Invalid namespace`. The full contract is in
  [`docs/sockets.md`](../../docs/sockets.md).
- **`/royal` runs on its own `Manager`, and `socket.io-client` is loaded for it with a dynamic
  `import()`.** `io()` caches one manager per origin and keeps the first caller's options, and
  the API authenticates from the cookies of that manager's handshake — sharing it with the
  anonymous `/comments` socket would send no credentials over polling and keep a pre-login
  handshake after sign-in. The dynamic import keeps the client out of guests' bundles:
  `useRoyalGames` is reached from every `GameCard`, so a static import ships it on every page.
- **Read and change royal games only through `useRoyalGames`.** The list has two sources — the
  persisted `games` store for guests, `royal.store` (filled over `/royal`) for a signed-in user —
  and the hook picks the side and routes writes to it. Reading `useGamesStore().royalGames`
  directly shows a signed-in user the leftover guest list, and writing to it changes nothing on
  the account.

## Verification

- **Do not reason about pixels — measure them.** `bun run check:layout` drives the installed
  Chrome through `playwright-core` and reports `main.container` height against the viewport at
  three widths, failing when a page marked `mustFit` overflows. Requires a running
  `bun run start`; set `CHROME_PATH` if Chrome is not on the default channel.
- **Every route answering 404 in `next dev` while the log shows no `Compiling …` line means the
  Turbopack persistent cache is stale, not that the routes are gone.** The pages come back as the
  not-found body under a 404 status and nothing in the log mentions the cache. Delete
  `apps/web/.next/dev` and restart — the dev server rebuilds its route table from source.
- **`curl` cannot see JSON-LD or anything JS injects.** Check structured data with Google's
  Rich Results Test; a "no schema found" conclusion drawn from `curl` is a false finding.
- Before adding a helper, search for an existing one. `getAverageRating` (the combined
  IGDB / HowLongToBeat / user rating) already existed in `src/lib/shared/utils/rating.utils.ts`.

## Drawer

- **Open long content beside the page with `drawer.open(node, { title })` from
  `shared/ui/Drawer`, never with a second panel of your own.** `DrawerConnector` is mounted once
  in `Layout`, docked to the window's right edge under the header, and it is what keeps the panel
  and `ExpandMenu` from overlapping: opening the drawer clears `useExpandStore`, and any menu that
  expands closes the drawer. A hand-rolled panel on the right edge ends up on top of the
  bottom-right menus (the profile's Menu, the admin controls on game pages).
- **Every element that opens the drawer carries `data-drawer-trigger`.** The drawer closes on a
  mousedown outside it, and mousedown fires before click — without the attribute, clicking
  "Show more" on the next review closes the panel and reopens it with a slide instead of swapping
  the text in place. `ExpandableBlock mode="drawer"` sets it on its own button.

## Modals

- **Modals must not push history entries.** `ModalsConnector` closes every open modal on
  `popstate`, so Back and Forward dismiss the modal *and* still navigate. Pushing an entry per
  modal (so Back only closes it) was tried and rejected: it swallows the Back press, and keeping
  the pushed depth in sync with programmatic closes needs bookkeeping that breaks as soon as
  anything else touches history.

- **`modal.open` stores the JSX it is given, so props passed at open time never update.**
  `ModalsConnector` keeps the element in state; the component that opened it can re-render all it
  likes and the modal will not see the new values. A modal that needs a pending state owns it —
  `ConfirmModal` disables its buttons from its own `useState` while it awaits `onConfirm`, which is
  why that callback may return a promise.

- Before building a new modal that shows a title plus a list of "row" blocks (an icon/content on one side, text on the other — e.g. `AchievementsModal`, `GamePlaysInfo`), ask the user whether the shared `RowsModal` component (`src/lib/shared/ui/RowsModal`) should be used instead of a bespoke layout. Do not silently assume either way.

## Data fetching failures

- **Every failed request already shows a toast**, from the response interceptor in
  `shared/api/agent.api.ts`. Nothing else needs to report an API error, and anything that makes a
  request the user did not ask for — a background refetch above all — turns a routine failure into
  a notification they cannot explain.
- **A mutation that deletes a resource must not leave a query for that resource to refetch.**
  Deleting a list used to invalidate `listQueryKeys.all`, which included the `bySlug` query the open
  list page was still rendering: it refetched, got `404 List not found`, and the interceptor toasted
  it. `useDeleteListMutation` now skips that one key with a `predicate`. `removeQueries` does not
  work here — an active observer immediately recreates the query and refetches it.
- **`QueryClient` does not retry 4xx.** A 404 or a 403 is not transient, and React Query's default
  `retry: 3` turned one deletion into four requests and four toasts, spread over the 1s/2s/4s
  backoff — which is why the success toast arrived seconds later and the delete looked like it had
  failed twice first.
- **Do not return the invalidation promise from a mutation's `onSuccess`.** React Query awaits it
  before the per-call `onSuccess`, so the toast, the modal close and the navigation all wait for
  every refetch to settle.

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

## Filters

- **The chip row that shows which filters are applied is the shared `AppliedFilters`
  (`shared/ui/AppliedFilters`); each page derives its own chips.** It renders nothing when the
  list is empty, so a page can mount it unconditionally. `/games` binds through
  `AppliedGameFilters`, which sits next to `Filters` because it is the companion of the same
  `ExpandMenu`, reads the query with `parseQueryFilters` and writes it back with
  `pushFiltersToQuery`; `/lists` builds its chips from `parseListsQuery` and pushes with
  `pushListsQuery`. Neither keeps filter state of its own — the URL is the state.
- **`selected.platforms` and `excluded.platforms` hold platform `_id`s; every other category
  holds the value that is displayed.** `Filters` feeds the platform dropdown
  `systems.map(item => item.name)` for display and `systems.map(item => item._id)` for the
  value, so anything rendering a platform filter has to map the id back through
  `useCommonStore().systems` or a raw ObjectId lands on screen.
- **Removing the last value of a category must also drop its `mode` entry.** `mode.<category>`
  carries the any/all toggle, and leaving it behind keeps a match mode in the URL for a filter
  that no longer exists — harmless to the query, but it comes back the next time that category
  is used.
- **"Clear all" keeps `sortBy`/`sortOrder`.** Sorting is not a filter, and dropping it resets
  the catalogue to its default order, which reads as the page losing the user's place.

## Selecting several games

- **Select mode pins the Manage drawer open through `isCloseOnOutsideDisabled`.** `ExpandMenu`
  closes on any outside `mousedown`, and the whole point of the mode is that the count, select-all
  and the two destinations live in that panel — without the pin, picking the first card collapses
  the controls you are using. The prop exists only for this; a drawer that is pinned for any other
  reason traps the user.
- **In select mode the card's `Link` is neutralised and the top-left rail is hidden.**
  `GameCard`'s `onClick` calls `preventDefault` so a pick does not navigate, and
  `wrapper_selectable` hides `card__rail_topLeft` — rank and the per-game royal crown sit exactly
  where the selection checkbox goes and mean something different while picking.
- **The selected ring is an `::after` overlay, never an `outline` on `.card`.** The cover `img`
  fills the card and paints over an outline drawn on the parent, which is the same trap the rounded
  tile rule in Layout describes.
- **Adding a selection to a list is one request per game.** `listsAPI.addGame` takes a single
  `gameId`, so `useAddListGamesMutation` awaits them in order — `position: "end"` means the order
  is the selection order — and invalidates once at the end rather than per game. Making this faster
  is a batch route on the API, not parallel requests.
- **The selection never reaches the URL.** The query string is what decides which games the page
  shows; a selection in it would turn a shared link into someone else's checkboxes. It lives in
  `games-selection.store`, which is deliberately not persisted, and turning the mode off clears it.

## Dropdowns

- **`Dropdown`'s wrapper carries `min-width: 170px`, so two of them never fit side by side on a
  phone.** The profile's rating filter (`From`/`To`) ran off the screen edge until its row gave the
  wrappers `flex: 1 1 0; min-width: 0` — a child selector from the parent module beats
  `.wrapper`'s own rule, so override it there instead of lowering the shared minimum.
- **`Dropdown` renders its list inline unless it gets `isThroughPortal`.** Unlike `DatePicker`,
  the portal is opt-in: without the prop the list is an absolutely positioned child of the field,
  so any ancestor with `overflow` — a modal's scroll area, a `Box` with `isWithScrollBar`, a
  compact panel — cuts it off. The playthrough modal's category list was clipped in the compact
  Wishlist layout for exactly this reason. Pass `isThroughPortal` for every dropdown inside a
  modal or a scrollable panel; the portal list follows the field on scroll and resize, and
  `#dropdown-connector` sits after `ModalsConnector` in `Layout`, so it stays above the modal.

## Scrolling

- **The page is not the document. Everything scrolls `#page-scroll`** — the `Scrollbar` that
  `Layout` wraps around `main` (`PAGE_SCROLL_ID` in `shared/utils/common.utils`), while `html` and
  `body` carry `overflow: hidden`. Anything that reads, moves or freezes page scroll targets that
  container, never `window`/`document.body`: `scrollPageToTop` and `useDisableScroll` both look it
  up by id, and a `window.scrollY` read is always 0.
- **Never size that container in `vh`.** `100vh` is the *large* viewport on mobile — the height
  with the URL bar retracted — while `html`/`body` at `height: 100%` are the visible one, so a
  `max-height: 100vh` scroller stood taller than `body` by the URL-bar height. The document then
  grew a second, parasitic scroll of those few dozen pixels: a full-height native scrollbar that
  `root.scss`'s `* { scrollbar-width: none }` does not reliably hide on every Chromium (it showed
  in Berry), and a page that swiped away under every `position: fixed` modal. The chain is
  `html`/`body` `height: 100%` → `.layout` flex column `height: 100%` → the scroll container
  `flex: 1 1 auto; min-height: 0` → content `max-height: 100%`. It is percentages the whole way
  down on purpose; `dvh` would fix the same bug only on engines new enough to know the unit.
- **`.layout` is what holds that chain, not `.root`/`#__next`.** Those selectors match nothing under
  the App Router — `app/layout.tsx` renders `body` → `QueryProvider` (no DOM node) → `Layout` — and
  the `reset.scss` rule that used to size them was dead, which is why the height chain broke and a
  `vh` value was reached for in the first place.
- **Modals freeze the page from `ModalsConnector`, once, through `useDisableScroll(!!content.length)`.**
  The hook counts locks in a module-level counter, so closing the top of a stack does not hand
  scrolling back while a modal underneath is still open. Do not call it from an individual modal.
- **Never put `overscroll-behavior: contain` on a panel inside the page.** The ancestor it refuses
  to chain to is `#page-scroll`, so the wheel over that panel stops moving the page entirely once
  the panel hits its end — the game page's Summary and Storyline are 132px tall and sit mid-page,
  and they froze the whole site under the cursor. `Scrollbar` deliberately leaves the property
  unset.
- **`Scrollbar`'s `fadeType` does nothing on a vertical scroll area.** The mask is applied only
  with `isHorizontal` and `isWithArrows`; `Box`, `Dropdown` and `GamesCards` pass `fadeType`
  and get no fade. A vertical scroll with fading edges is `ExpandableBlock mode="scroll"`, which
  measures the scroll position itself and drives the mask from its own classes.
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
