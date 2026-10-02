# GamePage

The page of one game: hero, overview, ratings, media, characters, details, related games,
reviews and discussion, release dates and multiplayer. Public, and the site's main search
landing page — there are about 10 000 of them.

## Routes

- `/games/[slug]` — `src/app/games/[slug]/page.tsx`.
- ISR: `export const revalidate = 3600` together with `generateStaticParams() { return []; }`,
  so nothing is prerendered at build time and each page is cached on first visit.
- `getGame` is `React.cache`d and shared by `generateMetadata` and the page. A slug containing
  `.` is rejected without a request. `generateMetadata` returns "Page not found" + `noindex`
  for a missing game (404) and a neutral `{ title: "Game" }` when the lookup fails for any other
  reason; only the page component calls `notFound()`.
- Metadata: title = game name, description = `summary` (or a fallback), keywords from name,
  genres, themes and IGDB keywords, canonical `/games/<slug>`, and a full `openGraph` block with
  the cover through `/img/image-proxy` (200×266).
- The route renders `VideoGame` and `BreadcrumbList` JSON-LD next to the page.
- No segment `error.tsx`: an API failure reaches `src/app/error.tsx` (`ErrorPage`), never a
  404 body.

## Data

- Server, all in the route: `gamesApi.getBySlug` (via `fetchOrNull`, 404 → `null`), then in
  parallel `gamesApi.getStats`, `commentsAPI.getReviews`, `gamesApi.getRelated` — each falls back
  to `undefined` on error so a failing side block never breaks the page.
- The page receives `game`, `stats`, `reviews`, `related` as props and renders them directly.
  Widgets below may run their own client queries (reviews paging, discussion), but the
  first render needs none.
- No URL state in the route. The `#reviews` and `#discussion` hashes (notification links) open
  that community tab and scroll to it; `GameCommunity` reads `window.location.hash` in an effect, never during
  render.

## Composition

1. `BGImage` — background derived from the game (deterministically, not at random).
2. `widgets/game/GameHero` — cover, name (`h1`), stats, controls.
3. Three columns: `entities/game/ui/GameOverview` (summary, storyline, keywords), `widgets/game/GameScoreColumn`,
   `widgets/game/GameSideColumn`.
4. `entities/game/ui/GameMedia` and `widgets/game/GameCharacters` — hidden for adult games
   when `useHideAdult()` is true.
5. `entities/game/ui/GameDetails` — the remaining catalogue facts.
6. `widgets/game/GameRelated`.
7. `features/game/ui/GameCommunity` — reviews (seeded with `initialReviews`) and the
   Discussion tab.
8. Two columns: `GameReleaseDates`, `GameMultiplayer`.
9. `features/game/ui/GameAdminControls` — admin-only `ExpandMenu` with parse/delete/revalidate.

## Rules and gotchas

- **Do not read `searchParams` in the route.** It turns the page dynamic and drops ISR for all
  game pages.
- **Never call `notFound()` from `generateMetadata`, and do not put a `Suspense` boundary above
  the page.** Either one produces a soft 404 (status 200 with the not-found body).
- **A failed fetch in `generateMetadata` must never return `noindex`.** The page still renders
  with real content, and ISR caches the "Page not found" head for an hour.
- **Restate `siteName`, `type`, `locale` and `images` in `openGraph`.** A page-level object
  replaces the root layout's; it does not merge.
- **Keep all content in the server HTML.** No wrapper that returns `null` until a client value
  arrives, no list that measures the DOM, and collapse long keyword lists with CSS
  (`ExpandableBlock clampHeight`), never `slice`.
- **Admin edits must call `revalidateGamePage` before `router.refresh()`.** A refresh alone is
  answered from the same cached entry and refills the cache with stale data.
- **Keep `useDiscussionSocket` out of `GamePage` and `GameCommunity`.** The socket opens only
  when the Discussion tab mounts; anywhere higher, every visitor opens a socket.
- **Nothing read during render may differ between server and client** — no `document` lookups,
  no `Math.random()`. `ExpandMenu`'s portal and `BGImage`'s choice both broke hydration on every
  game page before.
- Adult filtering fails closed: on the server `useHideAdult()` is true, so adult media is
  absent from the HTML by design.
- Image URLs in metadata go through `/img/image-proxy`, never under `/api` (blocked by
  `robots.txt`).
