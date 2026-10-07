# MainPage

The home page: banner with the pitch and three top-rated covers, a release calendar of upcoming
games marked with the moon of each release night, the latest releases, and an index of the genre
and platform hubs. Public, and an SEO entry point.

## Routes

- `/` — `src/app/page.tsx`.
- `export const dynamic = "force-dynamic"`: rendered per request — the top-rated covers are a
  random pick, and the calendar counts days from the request time (`now`, taken in the route
  with `new Date().getTime()`).
- Static metadata: `title: { absolute: MAIN_PAGE_META_TITLE }` (the `%s | MoonCellar` template
  does not apply to the root), `MAIN_PAGE_DESCRIPTION`, own keywords, canonical `/`.
- `MainPage.constants.ts` holds the page's copy and is re-exported from `index.ts`; the route
  imports the file directly.

## Data

All fetched in the route and passed as props; nothing is fetched on the client.

- `getGames()` in parallel: `gamesApi.getTopRatedRandom`, `getTotalGamesByCount` (genres),
  `getUpcomingReleases`, `getRecentReleases` — each falls back to `[]` with a logged error.
- `getFeaturedPlatforms` — `unstable_cache` (key `main-featured-platforms`, `revalidate: 3600`):
  `platformsAPI.getAll`, filtered to `FEATURED_PLATFORM_SLUGS` from `@mooncellar/schemas`, plus a
  `take: 1` count per platform. The fallback to `[]` is at the call site.
- `now` — the request time in ms, passed to `ReleaseCalendar`.
- No URL state.

## Composition

1. `BGImage`.
2. `Box` banner: `SectionTitle as="h1" variant="display"` with `MAIN_PAGE_TITLE`, description, a
   stack of the first three top-rated covers (cover skipped for adult games when
   `useHideAdult()` is true).
3. `Box` "Release calendar" with the game count — `widgets/main/ReleaseCalendar` (if any
   upcoming games).
4. `Box` "Out now" — `widgets/main/ReleaseRail` with dates (if any).
5. `Box` "Browse the catalogue" — two ruled lists, "By genre" (the first ten genres of the count
   list, largest first, linking to `/games/genre/<toSlug>`) and "By platform" (the featured
   platforms, linking to `/games/platform/<slug>`), each row a link with its exact count.

Both lists come from one `browseSections` array rendered by a single map, so they cannot drift
apart; a list with no items is dropped, and the box is not rendered when both are empty.

## ReleaseCalendar

- One horizontal timeline (`Scrollbar isHorizontal isWithArrows`) instead of a rail per quarter.
  It opens with "Tonight" (accent-ringed `MoonPhase`, the phase name as caption), then one stop per
  release day in date order, each marked with the moon of that night, the day number, the weekday
  and a countdown ("tomorrow", "in 6 days", "in 3 weeks", "in 4 months" — `Intl.RelativeTimeFormat`).
  A month label sits above the first stop of each month, with the year once it is not the
  current one.
- **Only a release whose label is an exact day ("Oct 13, 2026") becomes a dated stop.** The API
  puts every game of a quarter in its group, but `first_release` of a game known only as
  "Q3 2027", "Aug 2027", "2026" or "TBD" is a placeholder (often the quarter's last day). Those go
  to an undated stop at the end of their quarter — a dashed empty moon, the quarter as its title,
  "No date yet" — with each game's own label under its cover when it differs from the quarter.
  The label is `formatReleaseDate` from `entities/game/model`, the same text `ReleaseRail` shows.
- The grouping is the pure `buildReleaseCalendar` in `release-calendar.utils.ts`; dates are read
  and formatted in UTC, the zone `first_release` is stored in.
- **Everything time-dependent derives from the `now` prop, never from the clock in render.** The
  countdown, "Tonight" and the moon phases would otherwise differ between the server render and
  hydration.

## Rules and gotchas

- **Page blocks are styled under `.container` (`.container .banner`, `.container .browse`), not as top-level classes.**
  The classes go on `Box`'s content element through `classNameContent`, which already carries
  Box's own `display`/`flex-direction` at the same specificity; as top-level classes a flex row
  rendered as a column because Box's stylesheet loaded after the page's, and production orders
  the chunks differently from `next dev`.
- **Never catch inside the `unstable_cache` callback.** A `.catch(() => [])` inside stores the
  empty result for an hour — the platform list vanished for an hour after one render during an
  API outage. Let it throw; the `.catch` stays on the call in `Home`.
- **Change the cache key when the cached value changes shape.** `unstable_cache` returns the
  stored value under the old key for up to an hour after a deploy, so a new field read from
  `getFeaturedPlatforms` would be `undefined` until the entry expires.
- **Keep the page's content in the server HTML.** The calendar, rails and link lists render from
  props; do not move them behind a client-only flag or a DOM-measuring list.
- **The `<h1>` is the banner title.** `docs/seo.md` lists it as the home page's single `h1`; the
  section titles are `Box` titles (`h2`) and the browse list headings are `h3`.
- Adult covers fail closed: on the server `useHideAdult()` is true, so adult covers are not in
  the HTML.
- Counts are formatted with `toLocaleString("en-US")`, never the default locale, so the server
  and the browser print the same digits.
- Genre slugs come from `toSlug(genre)`; the genre hub resolves the slug the same way, so a
  change to one must change the other.
