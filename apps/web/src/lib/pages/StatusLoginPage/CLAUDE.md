# StatusLoginPage

The sign-in page of the project status hub (`status.mooncellar.space`): the shared `AuthModal` in its
`isPage` mode — sign in only, no close button, no sign-up — under a short heading.

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

1. Heading "Sign in to Status" and one line of copy.
2. `AuthModal isPage isSignIn`.

## Rules and gotchas

- **It leaves the page only when the store's `profile` changes after mount**
  (`useAuthStore.subscribe`), never because a profile is already there. The store is persisted
  per origin, so a stale profile with expired cookies would send the user to the gated route,
  which sends them back here — a loop.
- After the redirect it calls `router.refresh()`, so the gated layout re-reads the new cookies.
- Not an admin: the gated layout shows `StatusNoAccessPage`; this page does not check the role.
