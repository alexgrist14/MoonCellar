# MainPage

The home page: banner with the pitch and three top-rated covers, upcoming and recent releases,
a Gauntlet teaser, and links into the genre and platform hubs. Public, and an SEO entry point.

## Routes

- `/` — `src/app/page.tsx`.
- `export const dynamic = "force-dynamic"`: rendered per request (the top-rated covers are a
  random pick).
- Static metadata: `title: { absolute: MAIN_PAGE_META_TITLE }` (the `%s | MoonCellar` template
  does not apply to the root), `MAIN_PAGE_DESCRIPTION`, own keywords, canonical `/`.
- `MainPage.constants.ts` holds the page's copy and is re-exported from `index.ts` so the route
  can import it.

## Data

All fetched in the route and passed as props; nothing is fetched on the client.

- `getGames()` in parallel: `gamesApi.getTopRatedRandom`, `getTotalGamesByCount` (genres),
  `getUpcomingReleases`, `getRecentReleases` — each falls back to `[]` with a logged error.
- `getFeaturedPlatforms` — `unstable_cache` (key `main-featured-platforms`, `revalidate: 3600`):
  `platformsAPI.getAll`, filtered to `FEATURED_PLATFORM_SLUGS` from `@mooncellar/schemas`, plus a
  `take: 1` count per platform. The fallback to `[]` is at the call site.
- No URL state.

## Composition

1. `BGImage`.
2. `Box` banner: `SectionTitle as="h1" variant="display"` with `MAIN_PAGE_TITLE`, description, a stack of the first three top-rated
   covers (cover skipped for adult games when `useHideAdult()` is true).
3. `Box` "Upcoming Releases" — one `widgets/main/ReleaseRail` per quarter group (if any).
4. `Box` "Recently Released" — `ReleaseRail` (if any).
5. `Box` "Gauntlet" — `widgets/main/GauntletWheel`, RetroAchievements note, and
   `<Button href="/gauntlet" color={ButtonColor.GREEN}>` (link mode; `.cta` only sets width and
   margin).
6. `Box` "Browse By Genre" — the first ten genres of the count list (sorted by game count,
   largest first), linking to `/games/genre/<toSlug>`.
7. `Box` "Browse By Platform" — featured platforms, linking to `/games/platform/<slug>`.

Both browse blocks come from one `browseSections` array rendered by a single map, so the
genre and platform cards cannot drift apart; a section with no items is not rendered.

## Rules and gotchas

- **Never catch inside the `unstable_cache` callback.** A `.catch(() => [])` inside stores the
  empty result for an hour — "Browse By Platform" vanished for an hour after one render during
  an API outage. Let it throw; the `.catch` stays on the call in `Home`.
- **Keep the page's content in the server HTML.** The rails and link grids render from props;
  do not move them behind a client-only flag or a DOM-measuring list.
- **The `<h1>` is the banner title.** `docs/seo.md` lists it as the home page's single `h1`;
  the section titles are `SectionTitle` without `as="h1"`.
- Adult covers fail closed: on the server `useHideAdult()` is true, so adult covers are not in
  the HTML.
- Genre slugs come from `toSlug(genre)`; the genre hub resolves the slug the same way, so a
  change to one must change the other.
