# StatusProjectPage

One project of the status hub: its name, when it last uploaded, a tab per block and the selected
block — `PlanBlock` or `DecompBlock` (`widgets/status`).

## Routes

- `/<slug>` and `/<slug>/<block>` on the status host — `src/app/status/(gated)/[slug]/page.tsx` and
  `[slug]/[block]/page.tsx`, inside the gated layout. A missing or unknown `block` falls back to the
  project's first block (`decomp` before `plan`, the order of `PROJECT_BLOCKS`).

## Data

- `useProjectsQuery` — the project, its blocks and `uploads` (time, size, progress per block).
- `useProjectBlockQuery(slug, block, hasUpload)` — the block's JSON as the project uploaded it
  (`GET /projects/:slug/data/:block`), enabled only when that block was uploaded; both queries
  refetch every minute.

## Composition

1. `Box`: `SectionTitle as="h1"`, "Updated … ago" (turns `--color-attention` after
   `STALE_UPLOAD_MS`, a day) and the uploaded commit, then `Tabs` with `tabLink` per block when the
   project has more than one.
2. No upload of the block → inline `EmptyState` naming the upload endpoint.
3. Loading → `Skeleton`; loaded → `PlanBlock` or `DecompBlock`.

Its loading state is `StatusProjectSkeleton.tsx`.

## Rules and gotchas

- **Tab links are host paths (`/<slug>/<block>`), never `/status/...`.** The host rewrite adds the
  segment; a link with it is excluded from the rewrite and lands on the real route only by accident.
- An unknown slug renders the page-shaped `EmptyState`, not `notFound()`: the projects come from a
  client query, after the server response.
