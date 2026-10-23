# StatusLoginPage

The sign-in page of the project status hub (`status.mooncellar.space`): a centred card with the
wordmark, a heading and the shared `AuthModal` in its `isPage` mode — sign in only, no sign-up.

## Routes

- `status.mooncellar.space/login` — `src/app/status/login/page.tsx` (the host is rewritten to the
  `/status` routes, see the Status hub section of `apps/web/CLAUDE.md`). Metadata title "Sign in",
  `noindex` from `src/app/status/layout.tsx`.
- The route redirects an admin who already has a session straight to `next` (or `/`) on the
  server, through `getAdminAccessStatus`.

## Data

- `?next=` — where to go after signing in; only a same-site path passes `isSafeStatusPath`
  (`shared/utils/status-path.utils.ts`), anything else goes to `/`.
- No queries of its own: `AuthModal` calls `useAuth().login`, which fills `useAuthStore`.

## Composition

A card centred on the page, as in `docs/mockups/status-hub.html`: `Box` at `--status-card-width`
(380px) with the wordmark (`/images/logo-text.png`), "Sign in to Status", one line of copy and
`AuthModal isPage isSignIn` — the shared form without the modal's frame. The page is exactly
`--page-height-available` tall, so the card never pushes a scrollbar.

## Rules and gotchas

- **It leaves the page only when the store's `profile` changes after mount**
  (`useAuthStore.subscribe`), never because a profile is already there. The store is persisted
  per origin, so a stale profile with expired cookies would send the user to the gated route,
  which sends them back here — a loop.
- After the redirect it calls `router.refresh()`, so the gated layout re-reads the new cookies.
- Not an admin: the gated layout shows `StatusNoAccessPage`; this page does not check the role.
