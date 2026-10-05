# CustomListPage

One user-made game list: title, description, author, the games as a paged card grid, and for
the owner the tools to add, remove and reorder games. Public lists are open to everyone;
private ones only to their owner.

## Routes

- `/user/[name]/lists/[slug]` — `src/app/user/[name]/lists/[slug]/page.tsx`.
- Dynamic: it reads `cookies()` and `searchParams` (`page`, plus the sort params from
  `LIST_SORT_PARAM` / `LIST_ORDER_PARAM`).
- Before calling the API the route validates the name (`GetUserByStringSchema`) and the slug
  (`GetCustomListBySlugRequestSchema`); an impossible pair is a 404 without a request.
- `notFound()` when the list or its author is missing — from the page component only.
  `generateMetadata` returns "Page not found" + `noindex` for a missing list, `noindex` for a
  private one, and a bare `{ title: "List" }` when the lookup throws.
- When the stored slug differs from the URL's (renamed list), `permanentRedirect` to the current
  href, keeping `page` and the sort params.
- No segment `error.tsx`: an API failure reaches `src/app/error.tsx` (`ErrorPage`), never a
  404 body.

## Data

- Server: `GET /lists/by-slug` through `agent` with the request's `Cookie` header, wrapped in
  `React.cache` so metadata and page share it; `userAPI.getByString` for the author;
  `playthroughsAPI.getAll({ userId })` for the navigation; `gamesApi.getByIds` for the games of
  the requested page (`CUSTOM_LIST_GAMES_PAGE_SIZE`). `authUserId` is decoded from
  `accessMoonToken`.
- Client: `useListBySlugQuery(userName, slug, sort, initialData)`, `useGamesByIdsQuery(pageIds)`
  for the visible page, and `useGamesByIdsQuery(listIds, …, isManaging)` for all games in Manage
  mode. The server's page of games is seeded into `gameQueryKeys.byIds(ids)` once.
- Mutations: `useRemoveListGameMutation`, `useReorderListMutation`; editing opens `ListModal`.
- URL state: `page`, `sort`, `order`, all written with `window.history.pushState`. The sort
  params are dropped when the pick equals the list's own `sortBy`/`sortOrder`.

## Composition

1. `BGImage` with the author's background.
2. Mobile only: `ExpandMenu` (bottom-right, burger) holding `UserNavigation`.
3. `Box`: `Breadcrumbs` (Home / user / Lists / list), header with `SectionTitle as="h1"`,
   description, meta (author, count, updated, privacy) and actions — `ListLikeButton` (public),
   Edit (owner), Copy link (public), Manage / Cancel / Done (owner, not an imported list).
   An imported list (`source: "steam"`) shows a note that it comes from a Steam library.
4. Toolbar: `ListGameSearch` (owner, not managing, not an imported list) and `ListGamesSort`
   (more than one game).
5. Body: `EmptyState`, or `SortableGrid` in Manage mode, or `GamesCards` with `getRank` for a
   ranked list.
6. Desktop `UserNavigation` column.
7. `Pagination` (fixed), hidden while managing.

## Rules and gotchas

- **Forward the request's cookies to `by-slug`.** It answers 404 for a private list unless the
  viewer is its owner; without the `Cookie` header owners get "Page not found" on their own lists.
- **Pass `initialList` to the query only while the sort key equals the first-rendered sort.**
  React Query seeds every new key with `initialData` and does not fetch it within `staleTime`,
  so changing the sort would show the server's order under the new key.
- **Rank and Manage mode read each game's `position`, never the array index.** `by-slug`
  returns games in the requested order; the index would renumber a ranked list alphabetically
  and Done would save the sorted order.
- **Reorder is strict and removal is immediate.** `PATCH …/reorder` must receive exactly the
  list's games, so Remove deletes on the server at once and the search box is hidden while
  managing.
- **Page and sort go through `pushState`, not `router.push`.** `router.push` re-runs the server
  route and `useSearchParams` lags behind it, so the client query sees the new key too late.
- **Trust `authUserId` only when the auth store's profile agrees.** A stale cookie with a
  logged-out store must not get owner controls; on disagreement the page calls `refreshAuth`.
  Until the store has hydrated the page keeps the cookie's answer through `useIsAuthHydrated`,
  as `UserProfile` does — a `typeof window` check made the server and hydration renders
  disagree whenever store and cookie did.
- **Manage mode's grid uses `getSnappedColumns(CUSTOM_LIST_GAMES_PAGE_SIZE)`** so editing keeps
  the column count and card size of the normal view.
- Never show a loader that replaces the grid on `isFetching`; the page only dims the grid
  (`grid_fetching`) during a refetch.
- **An imported list (`list.source`) gets no add, remove, reorder or delete controls** —
  `canEditGames` is `isOwner && !list.source`. The API refuses those writes with 403; the games
  follow the Steam account (`docs/steam-import.md`).
