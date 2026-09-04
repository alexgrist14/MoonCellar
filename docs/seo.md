# SEO in MoonCellar

How search visibility works in this codebase: what matters, what was changed, and which
mechanisms will silently break it if touched carelessly.

Companion document: [`seo-audit.md`](./seo-audit.md) — the 2026-09-04 audit that started this
work. This file describes the state **after** those fixes.

---

## 1. The core constraint

MoonCellar's value for search is its long tail: **10,000 game pages** listed in the sitemap.
Everything else — the homepage, the catalogue, the Gauntlet — is a handful of URLs. So the
single question that decides whether SEO works here is:

> Does a crawler that fetches `/games/<slug>` get the game's content in the HTML response?

Before this work the answer was no. The page returned 200 with 49 KB of HTML, **zero
headings and 31 characters of visible text**. Everything else in this document is downstream
of fixing that.

Measured now:

| page | text in server HTML | links to games |
|---|---|---|
| `/games/<slug>` | 5 845 chars | — |
| `/games` | — | 60 |
| `/games/genre/<slug>` | 1 352 chars | 92 |
| `/games/platform/<slug>` | — | 93 |

---

## 2. Rendering: how content reaches the crawler

### 2.1 Nothing may be gated on client-only state

The original blocker was a component that returned `null` until a viewport measurement
landed:

```tsx
// removed
export const CheckMobile = ({ children }) => {
  const { isMobile } = useStatesStore();
  return isMobile !== undefined ? children : null;
};
```

`isMobile` was set inside a `useEffect`, so on the server it was always `undefined`. This
wrapper sat around the site header **and the entire game page**. The header is gone from
every page's HTML, the game page rendered as an empty shell.

It is deleted. Mobile/desktop differences are now CSS: both branches render, and
`@include mediaMd` (768px, `src/lib/app/styles/_media.scss`) decides which is visible — the
same breakpoint the JS used.

**Rule:** a component that wraps page content must never return `null` based on state that
only exists after hydration. If you need a viewport branch, render both and switch with CSS.

### 2.2 Lists must not depend on DOM measurement

`GamesCards` rendered the catalogue through `react-virtualized`. `AutoSizer` returns `null`
until it has measured its container, so the catalogue produced no markup on the server —
independently of the gate above.

It is now a plain CSS grid (`repeat(auto-fill, minmax(180px, 1fr))`, capped at
`var(--games-columns, 6)` above 1200px). Page size is 60 items, which is well inside what the
DOM handles comfortably; windowing bought nothing and cost the entire catalogue's indexability.

**Rule:** anything that renders a list of links must produce markup without measuring the DOM.

### 2.3 The catalogue is server-rendered

`src/app/games/page.tsx` is an async server component. It reads `searchParams`, rebuilds the
query string, parses it with the same `parseQueryFilters` the client uses
(`src/lib/shared/utils/filters.utils.ts`), fetches page 1 and hands it to the client page as
`initialData`.

The React Query cache key must match or the client would refetch and flash. `GamesPage`
compares them with TanStack's own `hashKey`:

```ts
hashKey(gameQueryKeys.list(params)) === hashKey(gameQueryKeys.list(initialParams))
```

Both objects are built by `parseQueryFilters`, so they hash identically.

---

## 3. Status codes

Non-existent games and users used to answer **200** with the not-found page and an injected
`<meta robots="noindex">`. Google reports that as a Soft 404 and it burns crawl budget across
an unbounded slug space.

Two causes, both fixed:

1. `notFound()` was called from `generateMetadata`. With streaming metadata Next renders that
   inside a `Suspense` below the already-flushed shell, so the throw is caught in-tree and the
   status is never set. The lookups are now wrapped in `React.cache` and `notFound()` is called
   only from the page component; `generateMetadata` returns fallback metadata instead.
2. `Layout` wrapped `{children}` in a global `<Suspense>`, which put every page below a
   boundary and reproduced the same swallow. That boundary moved down into the routes that
   actually need it (`/games`, `/gauntlet`, `/admin`, `/user/[name]` — all use
   `useSearchParams`).

**Rule:** never call `notFound()` from `generateMetadata`, and do not add a `Suspense`
boundary above a page component that can call it.

---

## 4. Canonical URLs and duplicates

`metadataBase` is set once in the root layout from `FRONT_URL`; every route declares
`alternates.canonical`.

This matters most for `/games`. The game page emits **14 kinds** of filter links
(`/games?selectedGenres[]=…`, `selectedPlatforms[]=…`, `years[]=…` …), which is an unbounded
set of URLs serving the same catalogue. `alternates: { canonical: "/games" }` collapses them
into one.

---

## 5. Structured data

`src/lib/shared/ui/JsonLd` renders `<script type="application/ld+json">`; builders live in
`src/lib/shared/utils/json-ld.utils.ts`.

| type | where |
|---|---|
| `WebSite` + `SearchAction` | root layout, every page |
| `VideoGame` | game page |
| `BreadcrumbList` | game page, catalogue, hubs, Gauntlet |
| `ItemList` | catalogue, hubs |

Visible breadcrumbs (`src/lib/shared/ui/Breadcrumbs`) exist on the same pages and carry the
same trail — structured data is supposed to describe what the user sees.

**`AggregateRating` is deliberately conditional.** It is emitted only when a game has at least
10 ratings *from MoonCellar users*. The catalogue's own ratings are sparse (top RPGs have one
to three), and the combined score shown on cards is an average of IGDB, HowLongToBeat and user
ratings — an aggregate of other sites' opinions, which is not what `AggregateRating` means.

---

## 6. Hub pages

`/games/genre/[slug]` and `/games/platform/[slug]` exist to solve orphaning: before them the
only server-rendered links into the 10,000 game pages were 66 on the homepage.

Both render from one component (`src/lib/pages/HubPage`) and use **only the existing**
`gamesApi.getAll` — no endpoints were added.

| block | query |
|---|---|
| Most popular | `sortBy: "rating"`, `sortOrder: "desc"`, `votes: 100 \| 20`, `types: ["Main Game"]`, `take: 5` |
| Recent releases | `sortBy: "first_release"`, `years: [null, currentYear]`, `types: ["Main Game"]`, `take: 6` |
| All games | `take: 60`, page 1 |

Three data facts drive those parameters, each found empirically:

- **`votes` is mandatory.** `sortBy: "rating"` sorts by the combined rating, but without a
  vote threshold games with no ratings at all come first. 100 leaves 506 RPGs, 20 leaves 1 875.
- **`types: ["Main Game"]` is mandatory.** Otherwise the recent rail fills with DLC and
  "Game of the Year Edition" entries.
- **`years: [null, currentYear]` is mandatory.** Of the 1 000 most recently dated RPGs, 904
  have release dates in the future.

**Thin pages are handled by indexing, not by hiding.** A hub with fewer than 100 games gets
`robots: { index: false, follow: true }` and is left out of the sitemap. Generating hundreds of
near-empty hubs is exactly the problem the audit flagged about user profiles.

**No pagination.** Hubs show the first 60 games and then a full-width link into the catalogue
with the filter applied (`/games?selectedGenres[]=Adventure`). This is not only simpler — it is
what makes hubs cacheable, see below.

**Known limitation:** `first_release` is a game's first release *anywhere*, not its release on
a given platform. That is why the platform hub has no year breakdown: deriving one produced
"PlayStation 2 · 1987–2026". Exact per-platform dates exist in `release_dates` but `getAll`
cannot filter by them.

---

## 7. Caching

Game pages and hubs are ISR:

```
Cache-Control: s-maxage=3600, stale-while-revalidate=31532400
x-nextjs-cache: HIT
```

Before, every request re-rendered and re-fetched: `private, no-cache, no-store` with ~865 ms
TTFB. Now a cached page answers in ~3 ms and the API is hit at most once an hour per URL.

Two non-obvious requirements:

1. `export const revalidate` alone is not enough. Without `generateStaticParams` the route
   stays dynamic and nothing is cached. All three routes export
   `generateStaticParams() { return []; }` — nothing is prerendered at build time (so the build
   does not depend on the API being reachable), but the route opts into caching with on-demand
   generation.
2. **A route that reads `searchParams` cannot be cached.** Hub pagination used to read
   `?page=`, and adding `generateStaticParams` to it crashed with `DYNAMIC_SERVER_USAGE`.
   Replacing pagination with the "show all" link removed the last `searchParams` read and made
   ISR possible.

**Rule:** adding a `searchParams` read to a hub or game route silently disables its cache.

---

## 8. robots.txt, sitemap, images

`robots.ts` disallows `/admin` and `/api`.

That disallow used to break image indexing: `og:image` and all 9 999 `<image:loc>` entries
pointed at `/api/image-proxy`, i.e. at a path the site forbids crawlers to fetch. The proxy
moved to **`/img/image-proxy`** — same allowlist and cache headers, just outside the blocked
prefix.

The sitemap (`src/app/sitemap.ts`, regenerated hourly via `unstable_cache`) now holds
**10 252 URLs**: 3 static, 10 000 games, 23 genre hubs, 220 platform hubs, plus user profiles.
The homepage entry gained its trailing slash to match what the site actually serves.

---

## 9. Everything else that shipped

- **`<h1>` on every page.** Previously the only `<h1>` in the project was on the 404 page.
- **Homepage title.** `Your Gaming Universe Awaits` had no brand and no keywords; the document
  title is now `MoonCellar — Game Tracker & Backlog Database`, kept separate from the banner
  copy (`MAIN_PAGE_META_TITLE` vs `MAIN_PAGE_TITLE`). The `%s | MoonCellar` template does not
  apply to the root segment, so this needs `title: { absolute }`.
- **Open Graph.** Game pages lost `siteName`/`type`/`locale` because a page-level `openGraph`
  object replaces the parent's wholesale — they are restated. A default 1200×630 banner
  (`public/images/og-default.png`) covers routes without their own image, and
  `twitter.card` is `summary_large_image`.
- **Alt text.** `alt="Game cover"` became `` alt={`${game.name} cover`} `` — this is also what
  gives the catalogue's 60 links their accessible name. Decorative images
  (`BGImage`, `Cover`, dropdown icons) got empty `alt`.
- **LCP.** Homepage banner covers and the first row of the catalogue grid render with
  `priority`; everything else stays lazy.
- **HSTS** via `headers()` in `next.config.mjs`.
- **Internal linking.** Genre and platform links on the game page and the homepage point at
  hubs instead of `?`-filters. The homepage carries 10 genre and 10 platform cards.

### `meta keywords` — kept on purpose

Google has ignored the tag since 2009, so removing it was in the plan. It stays because the
site is registered in Yandex Webmaster (`public/yandex_058d2e4bbfa6f684.html`) and Yandex has
never stated as plainly that it ignores it. There is no measurable cost to keeping it.

---

## 10. Verification

After `bun run build && bun run start` (port 3111):

```bash
# content actually reaches the crawler
curl -s localhost:3111/games/grand-theft-auto-v | grep -c '<h1'           # 1
curl -s localhost:3111/games | grep -oE '<a href="/games/[^"]*"' | wc -l  # ~60

# real 404s, not soft ones
curl -o /dev/null -w "%{http_code}\n" localhost:3111/games/nope-xyz       # 404
curl -o /dev/null -w "%{http_code}\n" localhost:3111/user/nope-xyz        # 404
curl -o /dev/null -w "%{http_code}\n" localhost:3111/games/genre/nope-xyz # 404

# canonical + structured data
curl -s localhost:3111/games | grep -c 'rel="canonical"'                  # 1
curl -s localhost:3111/games/grand-theft-auto-v | grep -c 'application/ld+json'

# ISR is actually on (second request must say HIT)
curl -sI localhost:3111/games/grand-theft-auto-v | grep -i x-nextjs-cache

# covers are crawlable
curl -s localhost:3111/sitemap.xml | grep -oE '<image:loc>[^<]{0,40}'     # /img/, not /api/
```

JSON-LD must be checked with Google's Rich Results Test, not curl — `curl` cannot see
JS-injected markup, and a check based on it produces false "no schema" findings.

Core Web Vitals: run pagespeed.web.dev manually. The audit could not measure field data
because the PSI API returns 429 without a key.

---

## 11. Still open

- **`www.mooncellar.space` has no TLS certificate.** Any inbound link to `www` fails. Lives in
  the deploy config outside this repository.
- **Game descriptions are the verbatim IGDB `summary`** — the same text as IGDB, Steam and
  every aggregator. A template built from data only MoonCellar has (own rating, playthrough
  counts, HLTB, RetroAchievements) would make them unique.
- **The homepage is still `force-dynamic`**, because `getTopRatedRandom` is meant to be random
  per visit. Caching it for an hour is a product decision, not a technical one.
- **User profiles are dynamic** (`cookies()` in the route) and largely client-rendered. Low SEO
  value; consider `follow, noindex` if the count grows.
- **Sitemap is a single 3.2 MB file.** Within the 50 000 URL / 50 MB limits, but a sitemap index
  would be tidier.
- **Hubs cannot page deeper than 60 games** by design; the catalogue link covers the rest.
