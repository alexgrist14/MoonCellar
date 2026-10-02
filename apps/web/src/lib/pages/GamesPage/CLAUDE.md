# GamesPage

The game catalogue: a filterable, paginated grid of 60 games per page, with a Manage drawer
for adding games to lists and selecting several at once. Public.

## Routes

- `/games` — `src/app/games/page.tsx`.
- Dynamic: the route reads `searchParams`. It rebuilds the query string, parses it with the
  same `parseQueryFilters` the client uses, fetches page 1 or `?page=` with `take: takeGames`
  (60), and passes `initialParams` + `initialData` to the page. A failed fetch passes
  `undefined` and the client fetches instead.
- Static metadata: title `Games`, canonical `/games`, own keywords. The route renders
  `BreadcrumbList` and, when there are results, `ItemList` JSON-LD.
- The page sits inside a `Suspense` with `PageLoader` in the route (it reads `useSearchParams`).

## Data

- `useGamesQuery(params, true, seededData)` — params come from `parseQueryFilters(asPath)` plus
  `page` and `take`. `seededData` is the server payload only when
  `hashKey(gameQueryKeys.list(params))` equals the key of `initialParams`.
- `useGamesSelectionStore` — select mode and the selected ids (not persisted, never in the URL).
- URL state: every filter, `sortBy`/`sortOrder` and `page`. Pagination writes with
  `window.history.pushState`; `Filters` and `AppliedGameFilters` write through
  `pushFiltersToQuery`, also `pushState`.

## Composition

1. `BGImage`.
2. Left `ExpandMenu` "Filters" → `features/filters/ui/Filters`.
3. Right `ExpandMenu` "Manage" → `widgets/main/GamesListMenu` (Controls with select mode, Royal list).
4. `Pagination` (fixed, `take={takeGames}`).
5. `Box`: `Breadcrumbs`, `SectionTitle as="h1"` "Games", `AppliedGameFilters` chips, then
   `Loader`, an `EmptyState` "Games not found", or `widgets/game/GamesCards` (6 columns, selectable in select
   mode).

## Rules and gotchas

- **Page state goes into the URL with `pushState`, never `router.push`.** `router.push` re-runs
  the server route and `useSearchParams` changes only after that render, so pagination scrolled
  to the top and swapped the cards later with no loader.
- **Seed `initialData` only for the key the server rendered.** React Query seeds every new key
  with `initialData` and does not fetch it within `staleTime`; the `hashKey` comparison is what
  keeps page 2 from showing page 1.
- **Gate the loader on `isLoading`, not `isPending` or `isFetching`.** `isFetching` is also true
  during a background refetch, which made every browser Back show a spinner and refetch.
- **The server must parse filters with the same `parseQueryFilters` as the client.** If the two
  keys differ, the seed is discarded and the first client render refetches.
- **The grid is CSS (`GamesCards`), never virtualised.** All 60 game links must be in the
  server HTML; `AutoSizer`-style measuring renders nothing on the server.
- **"Clear all" keeps `sortBy`/`sortOrder`**, and removing a category's last value drops its
  `mode.<category>` entry too.
- **Platform filters hold platform `_id`s.** Anything that displays them maps back through
  `useCommonStore().systems`.
- **Select mode pins the Manage drawer open (`isCloseOnOutsideDisabled`)** and neutralises card
  links; turning it off clears the selection. A selectable card's link carries `data-prevent-progress="true"`:
  `@bprogress` listens to every anchor's click in the capture phase, before the card's
  `preventDefault`, so without it each selection started the top progress bar. The selected
  card is outlined in its status colour (`--card-status-color`), accent when it has no status.
