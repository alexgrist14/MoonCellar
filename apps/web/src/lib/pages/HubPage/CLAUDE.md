# HubPage

A landing page for one genre or one platform: intro and counts, the most popular games, recent
releases, the first page of all games, and links to sibling hubs. Public, built for search
traffic. One presentational component serves both hub routes; all text and data come in as
props.

## Routes

- `/games/genre/[slug]` — `src/app/games/genre/[slug]/page.tsx`.
- `/games/platform/[slug]` — `src/app/games/platform/[slug]/page.tsx`.
- Both ISR: `revalidate = 3600` with `generateStaticParams() { return []; }`. Neither reads
  `searchParams`, which is what keeps them cacheable — hubs have no pagination.
- The slug is resolved against a `React.cache`d list (`gamesApi.getTotalGamesByCount` for
  genres, matched with `toSlug`; `platformsAPI.getAll` for platforms, matched on `slug`).
  The lookup throws when the API fails, so a failed render is never cached and the page shows
  the error boundary instead of a 404. `generateMetadata` returns "Page not found" + `noindex`
  only when the lookup succeeded and the slug is unknown, and a neutral `{ title: "Games" }`
  when it failed; only the page component calls `notFound()`.
- Metadata: `<Name> Games`, canonical, description with the game count, full `openGraph` with
  the default image; `robots: { index: false, follow: true }` below 100 games.
- Routes render `BreadcrumbList` and (when non-empty) `ItemList` JSON-LD.

## Data

All fetched in the route with `gamesApi.getAll`, each block falling back to an empty result:

- Most popular: `types: ["Main Game"]`, `sortBy: "rating"`, `votes` (genre: 100 at ≥5 000
  games, else 20; platform: always 20), `take: 5`.
- Recent releases: `types: ["Main Game"]`, `sortBy: "first_release"`,
  `years: [null, currentYear]`, `take: takeHubRecentGames` (6).
- All games: `take: takeHubGames` (30), page 1.
- Link section: genres with ≥100 games, or the first 24 platforms.

No client queries and no URL state; "Show all" links to `/games?selectedGenres[]=…` or
`/games?selectedPlatforms[]=<platformId>`.

## Composition

1. `BGImage` of the top game.
2. `Box`: `Breadcrumbs`, `SectionTitle as="h1" variant="display"` title, stats, intro. The
   stats stay an inline text row (`<b>value</b> label`), not `StatTile`s — a row of bordered
   tiles would outweigh the headline it sits under.
3. `Box` "Most popular" (only with a top game): featured `GameCard` with rank 01 and name link,
   then ranked `GameCard`s, then the note.
4. `Box` with the middle title/hint and `GamesCards` of recent releases.
5. `Box` with all games (`GamesCards`) and the "Show all N games" link — a full-width
   `Button href` (default colour).
6. `Box` of sibling hub chips, active one highlighted.

## Rules and gotchas

- **Never read `searchParams` in a hub route.** It disables the cache; filtering belongs to
  `/games`.
- **Keep `generateStaticParams` returning `[]`.** Without it `revalidate` does nothing on a
  dynamic segment, and returning real params would make the build depend on the API.
- **Pass the page size as `limit` to `GamesCards`.** The column count is snapped to a divisor of
  `limit`, so 30 games never leave a ragged last row.
- **Restate `siteName`, `type`, `locale` and `images` in `openGraph`.** The page-level object
  replaces the root one.
- **Never turn a failed slug lookup into an empty list.** `getGenres`/`getPlatforms` used to
  `.catch(() => [])`, so an API outage made every hub call `notFound()` and ISR cached that 404
  for an hour. Let the lookup throw (an errored render is not cached) and catch only in
  `generateMetadata`, where the fallback must not carry `noindex`. The same applies to the
  platform hub's metadata count: a failed count is not "0 games".
- **Do not catch inside an `unstable_cache` callback** if the lookup ever moves into one — a
  cached `[]` would turn every hub into a 404 for the whole revalidate window.
