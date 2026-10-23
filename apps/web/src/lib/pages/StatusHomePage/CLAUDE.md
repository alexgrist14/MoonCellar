# StatusHomePage

The root of the status hub (`status.mooncellar.space/`): opens the first project, or says there is
none yet.

## Routes

- `/` on the status host — `src/app/status/(gated)/page.tsx`, inside the gated layout
  (admins only, see `StatusShell`).

## Data

- `useProjectsQuery` (`entities/project/api`) — the same query the menu uses, so it is usually
  cached already.

## Composition

- Projects exist → `router.replace("/<first slug>")`, with a `Skeleton` meanwhile.
- None → `EmptyState` "No projects yet" with a link to `/manage`.

## Rules and gotchas

- `replace`, never `push`: Back from the first project must leave the hub, not bounce through
  `/` again.
