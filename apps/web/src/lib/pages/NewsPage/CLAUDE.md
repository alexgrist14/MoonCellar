# NewsPage

The feed of published posts — site news and game articles — ten per page, filterable by kind,
publication date and the game an article is about. Public.

## Routes

- `/news` — `src/app/news/page.tsx`.
- Dynamic: the route reads `searchParams`, parses them with `parseNewsQuery`
  (`features/news/model/news-query.utils`), fetches `articlesAPI.getArticles(params)` and
  `articlesAPI.getArchive()` in parallel and passes `initialParams`, `initialData` and
  `initialArchive`. A failed fetch passes `undefined`.
- Static metadata: title `News`, canonical `/news`, own keywords. The route renders
  `BreadcrumbList` JSON-LD and wraps the page in `Suspense` with `PageSkeleton`.

## Data

- `useArticlesQuery(params, seededData)` — seeded only when `hashKey(articleQueryKeys.feed(params))`
  matches the key of `initialParams`.
- `useArticleArchiveQuery(initialArchive)` — post counts per year and month, over every published
  post whatever the other filters.
- `useGamesByIdsQuery([game])` — the name for the "About: …" chip when the page holds no post of
  that game.
- URL state: `type`, `year`, `month` (only with `year`), `game`, `page`. Every write goes through
  `pushNewsQuery`, which uses `window.history.pushState`.

## Composition

1. `BGImage`.
2. A grid capped at `--news-page-width`: a head `Box`, the list `Box`, and an `aside` of
   `--news-sidebar-width`.
3. Head `Box`: `Breadcrumbs`, `SectionTitle as="h1"` "News" with a "Write a post" button for
   admins, segmented `Tabs` All / Site news / Game articles with `counts` from the response,
   `AppliedFilters` (date and game), and below `media960` the compact filters —
   `NewsArchiveSelect` (a `Dropdown`) and `NewsGameFilter`.
4. List `Box`: `ArticleRow` per post (or four `ArticleRowSkeleton`s, or `EmptyState`), then
   `Pagination` when there is more than one page.
5. `aside` (hidden below `media960`): `Box` "Archive" with `NewsArchive` and `NewsGameFilter`.

## Rules and gotchas

- **The URL is the only filter state.** Tabs, chips, the archive and the dropdown all read
  `parseNewsQuery` on every render and write with `pushNewsQuery`; never `router.push`, which
  re-renders the route on the server and delays `useSearchParams`.
- **Both filter sets are always rendered and CSS picks one.** The archive tree and the compact
  dropdown switch at `media960`; gating either on the viewport in JS would drop the archive
  links from the server HTML.
- **The archive links are real `href`s with `onClick` → `pushNewsQuery`.** Crawlers follow them
  to the filtered pages; people stay on the client. They carry `prefetch={false}`, or every
  month in the tree would prefetch a server render.
- **"Clear all" keeps `type`.** The kind is a tab, not a chip.
- **The admin button waits for `useIsAuthHydrated`.** `isAdmin` comes from the persisted auth
  store, which the server render does not have; reading it before hydration mismatches the HTML.
- Dates are formatted in UTC (`formatArticleDate`), the same zone the API groups the archive
  by, so a post published near midnight sits in the month the archive counts it in, on the server
  and in every browser.
