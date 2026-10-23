# StatusNoAccessPage

What a signed-in user without the `admin` role sees anywhere on the status hub: "No access", who
they are signed in as, Sign out and a link back to the site. Nothing about projects is fetched.

## Routes

- Any gated route on the status host when `GET /admin/access` answers 403 — rendered by
  `src/app/status/(gated)/layout.tsx` in place of the hub, never a route of its own.

## Data

- `viewer` (`id`, `userName`) — decoded by the layout from `accessMoonToken`.

## Composition

- `Box` → `EmptyState variant="page"` with `SvgLock`, Sign out (`useAuth().logout(viewer.id)`) and
  "Go to MoonCellar" (`FRONT_URL`).

## Rules and gotchas

- Sign out must go through `logout`: the session cookies are `httpOnly`, only the API's logout
  answer clears them.
