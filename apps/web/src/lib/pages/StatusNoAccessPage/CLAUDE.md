# StatusNoAccessPage

What a signed-in user without the `admin` role sees anywhere on the status hub: "No access", who
they are signed in as, Sign out and a link back to the site. Nothing about projects is fetched.

## Routes

- Any gated route on the status host when `GET /admin/access` answers 403 — rendered by
  `src/app/status/(gated)/layout.tsx` in place of the hub, never a route of its own.

## Data

- `viewer` (`id`, `userName`) — decoded by the layout from `accessMoonToken`.

## Composition

- A card centred on the page (`Box` at `--status-card-width`, the page exactly
  `--page-height-available` tall, so no scrollbar) → `EmptyState` (default shape, `as="h1"`) with
  `SvgLock`, Sign out and "Go to MoonCellar" (`FRONT_URL`), as in `docs/mockups/status-hub.html`.

## Rules and gotchas

- Sign out must go through `logout`: the session cookies are `httpOnly`, only the API's logout
  answer clears them. It passes `{ href: STATUS_SIGN_IN_PATH }` for a full page load — the gated
  layout that rendered this page re-reads the cookies only then; a soft navigation left "No access"
  on screen.
- Not `EmptyState variant="page"` inside a full-height `Box`: the box's padding on top of the full
  height made the page scroll.
