# NotFoundPage

The 404 screen: illustration, "404", a short message and a Back to home link. Everyone can
land on it. It takes no props and fetches nothing.

## Routes

- `src/app/not-found.tsx` — every `notFound()` call and every unknown URL. Static metadata:
  title `Page not found`, `robots: { index: false, follow: false }`.
- Never from an `error.tsx`: errors render `ErrorPage`. The game, profile and list segments
  used to show this page from their error boundaries, so an API outage looked like a 404.

## Data

None.

## Composition

1. `Box` with `minHeight: var(--page-height-available)`.
2. Figure: `SvgMoonBackdrop` + `/images/not-found.png` (`next/image`, `priority`).
3. `EmptyState variant="page" as="h1"` with `eyebrow="404"`, the figure as `icon`, the text as
   `description` and `<Button href="/" color={ButtonColor.ACCENT}>` as `action`. The module
   only styles the figure.

## Rules and gotchas

- **A real 404 status comes only from `notFound()` in a page component.** Rendering this
  component directly — from an `error.tsx` boundary, say — answers with whatever status the error
  produced, without the `noindex` the not-found route adds. Do not use it as a substitute for
  `notFound()`.
- **Never call `notFound()` from `generateMetadata` or below a `Suspense` boundary that sits
  above the page.** Both give a soft 404: status 200 with this page's body.
- The page sits inside a `Box` like every other content block, because `BGImage` may be showing
  behind it.
- **Never put a `Button` inside a `Link`.** A `<button>` inside an `<a>` is invalid HTML; use
  `Button`'s link mode (`href`).
