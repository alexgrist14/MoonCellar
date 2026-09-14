# SEO

An inventory of the search-related functionality in `apps/web`: what exists and where it lives.

## Metadata

`src/app/layout.tsx` declares the defaults every route inherits:

- `metadataBase` from `FRONT_URL`, so relative canonicals and image paths resolve to absolute URLs.
- `title.default` — `MoonCellar — Game Tracker & Database`; `title.template` — `%s | MoonCellar`.
- A site description and a `keywords` list.
- Open Graph defaults: `siteName: "MoonCellar"`, `type: "website"`, `locale: "en_US"`, and
  `/images/og-default.png` (1200×630, PNG) as the fallback image.
- `twitter.card: "summary_large_image"`.

Each route adds its own metadata on top:

| Route                    | Title                                       | Canonical                | Other                                                                                                                                                           |
| ------------------------ | ------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | `MAIN_PAGE_META_TITLE` via `title.absolute` | `/`                      | own `keywords`; the template does not apply to the root segment                                                                                                 |
| `/games`                 | `Games`                                     | `/games`                 | own `keywords`                                                                                                                                                  |
| `/games/[slug]`          | game name                                   | `/games/<slug>`          | description from `game.summary`, keywords from name + genres + themes + IGDB keywords, Open Graph block restated in full with the cover as `og:image` (200×266) |
| `/games/genre/[slug]`    | `<Genre> Games`                             | `/games/genre/<slug>`    | description carries the game count; `robots: { index: false, follow: true }` when the genre has fewer than 100 games                                            |
| `/games/platform/[slug]` | `<Platform> Games`                          | `/games/platform/<slug>` | same shape as the genre hub, count fetched with a `take: 1` query                                                                                               |
| `/gauntlet`              | `Gauntlet`                                  | `/gauntlet`              | own `keywords`                                                                                                                                                  |
| `/user/[name]`           | `Profile: <name>`                           | `/user/<name>`           | description from the user's own bio when set                                                                                                                    |
| `not-found`              | `Page not found`                            | —                        | `robots: { index: false, follow: false }`                                                                                                                       |

A page-level `openGraph` object replaces the parent's rather than merging with it, which is why
the game and hub routes repeat `siteName`, `type` and `locale`.

When `generateMetadata` cannot find the entity (game, hub, user) it returns
`title: "Page not found"` with `robots: { index: false, follow: false }`.

## Status codes

`fetchOrNull` (`src/lib/shared/utils/not-found.utils.ts`) turns a 400 or 404 from the API into
`null` and rethrows anything else. Routes with a dynamic segment wrap their lookup in
`React.cache`, call it from both `generateMetadata` and the page component, and call
`notFound()` only from the page component — so a missing entity answers with a real 404 rather
than a 200 carrying the not-found page.

The root layout keeps its `Suspense` boundary around `NavigationProgress` only; routes that need
one (`/games`, `/gauntlet`, `/user/[name]`) declare it inside the route, below the page
component.

## Rendering

Everything a crawler needs is in the server response.

- `/games` is an async server component. It rebuilds the query string from `searchParams`,
  parses it with the same `parseQueryFilters` the client uses, fetches page 1 (`take: 60`) and
  passes it to the client page as `initialData`. `GamesPage` compares the two React Query keys
  with TanStack's `hashKey`, so the client reuses the server payload instead of refetching.
- The catalogue grid is CSS (`repeat(auto-fill, …)` in `GamesCards.module.scss`), so all 60 game
  links exist in the HTML without any DOM measurement. `react-virtualized` is used only by the
  dropdown list component.
- The game page, both hubs and the homepage fetch their data in the server component and render
  it directly.

`<h1>` per page: the homepage banner title, `Games` on the catalogue, `Gauntlet`, the game name
on a game page, the hub title on both hubs, and the 404 page. Both catalogue and Gauntlet render
theirs through `SectionTitle as="h1"`.

Visible breadcrumbs (`src/lib/shared/ui/Breadcrumbs`) appear on the game page, the catalogue,
both hubs, the Gauntlet and user profiles.

## Structured data

`src/lib/shared/ui/JsonLd` renders a `<script type="application/ld+json">` with `<` escaped;
the builders live in `src/lib/shared/utils/json-ld.utils.ts`.

| Type                       | Where                                     | Contents                                                                    |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `WebSite` + `SearchAction` | root layout, every page                   | search endpoint `/games?search={search_term_string}`                        |
| `VideoGame`                | game page                                 | name, url, description, cover, genres, `datePublished` from `first_release` |
| `AggregateRating`          | inside `VideoGame`                        | only when the game has at least 10 MoonCellar ratings; scale 1–10           |
| `BreadcrumbList`           | game page, catalogue, both hubs, Gauntlet | the same trail as the visible breadcrumbs                                   |
| `ItemList`                 | catalogue, both hubs                      | the games rendered on the page, with position, url and name                 |

## Hub pages

`/games/genre/[slug]` and `/games/platform/[slug]` render from one component
(`src/lib/pages/HubPage`) and read only `gamesApi.getAll`.

| Block           | Query                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Most popular    | `sortBy: "rating"`, `sortOrder: "desc"`, `types: ["Main Game"]`, `votes`, `take: 5`                             |
| Recent releases | `sortBy: "first_release"`, `sortOrder: "desc"`, `types: ["Main Game"]`, `years: [null, currentYear]`, `take: 6` |
| All games       | `take: 30`, page 1                                                                                              |

The vote threshold is 100 for genres with 5 000 games or more and 20 otherwise; the platform hub
always uses 20. `types: ["Main Game"]` keeps DLC and re-releases out of the ranked blocks, and
`years: [null, currentYear]` keeps unreleased titles out of the recent one.

Each hub ends with a link into the catalogue with the filter applied
(`/games?selectedGenres[]=…`, `/games?selectedPlatforms[]=…`) and a block of sibling links —
every genre with at least 100 games, or the first 24 platforms. Hubs have no pagination and read
no `searchParams`, which is what lets them be cached.

The platform hub's "recent releases" hint states that dates are a game's first release anywhere,
not its release on that platform.

## Caching

| Route                      | Strategy                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/games/[slug]`, both hubs | ISR: `export const revalidate = 3600` together with `generateStaticParams()` returning `[]` — nothing is prerendered at build time, and the route is cached on demand |
| `/`                        | `force-dynamic`; featured platforms come from `unstable_cache` with a 3600 s revalidate                                                                               |
| `/games`                   | dynamic, it reads `searchParams`                                                                                                                                      |
| `sitemap.xml`              | `force-dynamic`, with each upstream call wrapped in `unstable_cache` at 3600 s                                                                                        |
| `/img/image-proxy`         | `force-dynamic`; the upstream fetch revalidates hourly and the response carries `public, max-age=3600, s-maxage=86400`                                                |

A route that reads `searchParams` cannot be statically cached, which is why the two hubs take no
query parameters.

## robots.txt and sitemap

`src/app/robots.ts` allows everything for `*`, disallows `/admin` and `/api`, and points at
`${FRONT_URL}/sitemap.xml`.

`src/app/sitemap.ts` emits, in order:

1. The three static links from the `links` constant — `/`, `/games`, `/gauntlet`.
2. Every game: `/games/<slug>` with `lastModified` from the record and, when the game has a
   cover, an `<image:loc>` pointing at `/img/image-proxy`.
3. Genre hubs with at least 100 games (`MIN_GAMES_FOR_HUB`), slugged with `toSlug`.
4. Every platform hub.
5. Every user profile, with `lastModified`.

Each of the four upstream calls has its own `unstable_cache` entry and falls back to an empty
list on error, so one failing endpoint does not empty the whole sitemap.

## Images

- `/img/image-proxy` (`src/app/img/image-proxy/route.ts`) streams remote covers. It requires
  `https`, matches the hostname against an allowlist (IGDB, the S3 and DigitalOcean Spaces
  buckets), verifies that the upstream content type starts with `image/`, and answers 400, 403
  or 502 otherwise. It sits outside `/api` so that `robots.txt` does not block the images the
  sitemap and Open Graph tags reference.
- `next.config.mjs` lists the same hosts in `images.remotePatterns` for `next/image`, plus
  RetroAchievements, YouTube thumbnails and the API host.
- `/_next/static/media/*` is served with `X-Robots-Tag: noindex`.
- Game covers use ``alt={`${game.name} cover`}``; decorative images carry an empty `alt`.

## Headers

`next.config.mjs` sends `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
on every path.

## Search engine verification

- `public/yandex_058d2e4bbfa6f684.html` — Yandex Webmaster.
- `public/74a6b85cd7164d77a0cccb5baae3d563.txt` — a key file in the IndexNow format, its body
  repeating its own name.

`meta keywords` are declared on the root layout, the homepage, the catalogue, the Gauntlet, game
pages and user profiles.
