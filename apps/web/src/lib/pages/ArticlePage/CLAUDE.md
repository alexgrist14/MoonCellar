# ArticlePage

One published post. A game article shows the game it is about in a panel beside the text; site
news shows the latest posts there instead. Public.

## Routes

- `/news/[slug]` — `src/app/news/[slug]/page.tsx`.
- ISR: `revalidate = 3600`, `generateStaticParams()` returns `[]`. The admin editor purges a post
  with `revalidateArticlePage` (`entities/article/api/article.actions.ts`) after every save and
  delete.
- The route loads the post with `fetchOrNull(articlesAPI.getBySlug)` inside `React.cache`; a
  missing or unpublished post is `notFound()` from the page component, and `generateMetadata`
  returns neutral metadata when the request fails.
- Metadata: title, description from the summary, canonical `/news/<slug>`, a full Open Graph
  block (`type: article`, `publishedTime`, `modifiedTime`, the post image or the game cover,
  `og-default.png` otherwise). JSON-LD: `Article` and `BreadcrumbList`.

## Data

- A game article: the full game through `gamesApi.getByIds({ _ids: [id] })` and its player
  counts through `gamesApi.getStats`, both server-side.
- Site news: the four latest posts (`articlesAPI.getArticles({ take: 4 })`), minus this one.
- On the client, every open registers a view: `useRegisterArticleViewMutation` posts
  `POST /articles/:id/views` once per mount, silently (`isSilent`, a failure toasts nothing). The
  API counts one view per visitor per 30 minutes, so reloads in a row do not inflate it.
- An admin's count comes from `useAdminArticleQuery(article._id)` — the only response that carries
  `views` — enabled once the view request has settled, so the number includes this open.

## Composition

1. `BGImage` with the game, or the default one for site news.
2. A grid capped at `--news-page-width` with areas `head side / body side`; below `media960` it
   stacks `head / side / body` for a game article and `head / body / side` for site news.
3. Head `Box`: `Breadcrumbs`, a meta row (`Badge` with the kind, date, reading time; for admins the
   view count and "Edit post", pushed to the right), the `h1`, the summary, the author with
   `Avatar`.
4. Side: `widgets/news/ArticleGamePanel`, or a `Box` "Latest posts" with `ArticleLinks`.
5. Body `Box`: the post image (or the game's first artwork) and `RichText size="article"`.

## Rules and gotchas

- **Load the game with `getByIds`, not `getById`.** `GET /games/by-id/:id` reads `_id` from the
  query string while `gamesApi.getById` sends it in the path, so it answers 400 and the panel
  disappears.
- **An adult game hides its media for viewers who hide adult content**: the cover in the panel,
  the background and the post image (`getArticleImage`, `isArticleMediaHidden`). The text stays.
- **"Edit post" waits for `useIsAuthHydrated`**, like every admin control read from the persisted
  auth store.
- **The view count is never part of the route's data.** The page is ISR, so anything the server
  render reads is cached in the HTML every visitor gets; `GET /articles/by-slug` does not return
  `views`, and the count is loaded on the client for admins only.
- Panel padding is `--article-box-padding`, which drops to `--padding-x3` below 768px; pass it
  through `contentStyle`, never a class on `Box`'s content.
