# Admin

The moderation and catalogue back office. One client page renders every admin tab; only users
whose account is an admin ever see it — everyone else gets a 404.

## Routes

- `/admin/users`, `/admin/games`, `/admin/comments`, `/admin/conflicts`, `/admin/characters`,
  `/admin/images`, `/admin/sites` — one route file each under `src/app/admin/<tab>/page.tsx`,
  each rendering `<Admin tab="<tab>" />` inside a `Suspense` with `PageLoader` (the page reads
  `useSearchParams`).
- `/admin` (`src/app/admin/page.tsx`) only redirects: the legacy `?tab=<tab>` becomes
  `/admin/<tab>`, an unknown or missing tab becomes `/admin/users`, other query params are kept.
- `src/app/admin/layout.tsx` gates the whole segment on the server: no `accessMoonToken` and no
  `refreshMoonToken` cookie → `notFound()`; otherwise it calls `GET /admin/access` with the
  request's cookies (`no-store`) and answers 404 on `403`, or on `401` without a refresh cookie.
  A `401` with a refresh cookie, or an unreachable API, lets the page render so the client can
  refresh the session.
- Dynamic (cookies). No metadata of its own; `robots.ts` disallows `/admin`.

## Data

- `useAuthStore` — `isAdmin` and `isAuthChecked` gate the client render.
- Tab badge counts, all enabled only for admins: `useRequestsQuery` (pending game and character
  requests, `take: 1`, reads `total`), `useCommentReportsQuery("open", 1)`,
  `useConflictsSummaryQuery` (`pending`).
- Each widget fetches its own table data.
- URL state: the main tab is the path segment, switched with `router.push(getAdminHref(tab))`
  (a different route). The sub-view of Games, Comments and Characters is `?view=requests` /
  `?view=reports`, written with `setAdminQuery` (`window.history.pushState`), no server request.

## Composition

1. `Box` → `Breadcrumbs` (Home / Admin / tab label).
2. `Tabs` — the seven main tabs with badge counts; `mobileMenuTitle="Admin"`.
3. The active tab:
   - Users → `widgets/admin/UserList`.
   - Games → segmented `Tabs` List / Requests: `GameList` or `RequestsReview kind="game"`.
   - Comments → List / Reports: `CommentList` or `ReportList`.
   - Conflicts → `Conflicts`.
   - Characters → List / Requests: `CharactersAdmin` or `RequestsReview kind="character"`.
   - Images → `ImageGenerator`.
   - Sites → `SiteSessions`.

## Rules and gotchas

- **Keep both gates: the server layout and the client `isAuthChecked && !isAdmin → notFound()`.**
  The layout lets a 401-with-refresh-cookie through, so only the client check catches a session
  that turns out not to be an admin after the refresh.
- **Render no admin content until `isAdmin` is true — show `PageLoader` instead.** The badge
  queries are disabled until then, and rendering the widgets earlier fires admin requests that
  fail with toasts. Returning nothing left a blank page whenever the auth check stalled.
- **Add a tab in `admin-url.utils.ts` (`ADMIN_TABS`, `ADMIN_TAB_LABELS`), add its route file, and
  keep `mainTabs` in the same order.** `tabIndex` is the index into `ADMIN_TABS`, and `selectTab`
  maps the clicked index back through it; a tab out of order opens the wrong section.
- **Sub-views use `setAdminQuery`, not `router.push`.** A `router.push` re-runs the server layout
  (including the `/admin/access` fetch) for what is only a client toggle.
- **An admin mutation that changes a game page must call `revalidateGamePage` before
  `router.refresh()`.** Game pages are ISR for an hour; a refresh alone refills the cache with
  the stale render.
- **The Images list has two sources: generated images not yet uploaded live only in the
  browser's `generated-images` store, and uploaded ones come from `GET /admin/images`.**
  `ImageGenerator` merges them, skipping a database image whose id is already a local entry's
  `savedId`. Reading only the store hid every upload from any other browser — images uploaded
  from a local run (which writes to the production database through the `bun run mongo` tunnel)
  never appeared on the production admin. A database-only row has no data URL, so it offers no
  Regenerate or Split; it can be opened, linked, downloaded and deleted.
- **Download fetches the image into a blob, and the Space sends no CORS headers.** A local row
  downloads its data URL; a database-only row's fetch to the CDN fails and `downloadImage` opens
  the file in a new tab instead. Either one is the compressed copy (`compressDataUrl`: 1536px,
  WebP 0.85) — the provider's full-size output is not kept anywhere.
- Tables in the widgets go through the shared `Table`; rows that open a page are clickable as a
  whole through `onRowClick` (interactive columns listed in `rowClickExcludeKeys`), with no
  separate "Open" column. The field diff in `RequestReviewPanel` stays a native `<table>`: `Table`
  lays out each column separately, so cells of different heights would not line up as rows.
