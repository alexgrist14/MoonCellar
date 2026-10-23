# ArticleEditPage

The admin editor for one post: kind, game, title, summary, image and text, with Save draft /
Publish, Unpublish and Delete. Admins only.

## Routes

- `/admin/news/new` and `/admin/news/[id]` — `src/app/admin/news/[id]/page.tsx`, which passes
  `articleId` (`undefined` for `new`). The `/admin` layout gates the segment on the server.
- Dynamic (cookies). No metadata of its own; `robots.ts` disallows `/admin`.

## Data

- `useAdminArticleQuery(id)` — the post with its text, drafts included, enabled only for admins.
- The editor (`widgets/admin/ArticleEditor`) saves through `useSaveArticleMutation` (create or
  replace) and deletes through `useDeleteArticleMutation`; images go up through
  `filesAPI.uploadCommentImage`, the same endpoint `RichEditor` uses for inline images.

## Composition

1. `Box`: `Breadcrumbs` (Home / Admin / News / title), `SectionTitle as="h1"`.
2. `ArticleEditor`, keyed by the post id so a different post starts from a fresh draft — or
   `EmptyState` when the id does not exist.

## Rules and gotchas

- **Keep both gates, as `Admin` does:** the server layout, and `isAuthChecked && !isAdmin →
  notFound()` with `PageSkeleton` until `isAdmin` is true.
- **The draft is plain component state validated with `SaveArticleRequestSchema` on save**, not a
  react-hook-form form, so none of the `isValid` traps in `apps/web/CLAUDE.md` apply. Errors map
  to the field by the first segment of the issue path.
- **Call `editorRef.flushUploads()` before validating** — it uploads the images pasted into the
  text and returns the HTML with their final URLs.
- **Every save and delete calls `revalidateArticlePage` with the old and the new slug**, or the
  public page keeps the cached render for an hour. A post's slug follows its title only until the
  first publication (the API freezes it then), so the two differ only for drafts.
- **After creating a post the page `router.replace`s to `/admin/news/<id>`**, so a second click on
  Save updates that post instead of creating another.
