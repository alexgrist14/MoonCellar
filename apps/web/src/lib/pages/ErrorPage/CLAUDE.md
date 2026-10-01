# ErrorPage

The generic error screen: a heading, a short message, a Try again button and a link home.
Shown when a route throws for any reason other than a missing record.

## Routes

- `src/app/error.tsx` — the only error boundary below the root layout. It logs through
  `logger.error` and passes Next's `retry` (router refresh + boundary reset) as `onRetry`.
  `src/app/global-error.tsx` covers the root layout itself and cannot use this page, because
  it renders without the root layout and its styles.

## Data

None. `onRetry` is the only prop.

## Composition

1. `Box` with `minHeight: var(--page-height-available)`.
2. `EmptyState variant="page" as="h1"` without a figure (centred): "Something went wrong",
   text, an accent `Button` "Try again" and `<Button href="/">` "Back to home". No module of
   its own.

## Rules and gotchas

- **Never render `NotFoundPage` from an error boundary.** An API failure then looks like a 404
  to the visitor while the status says otherwise; a missing record is `notFound()` in the page
  component, everything else ends here.
- **Pass `retry`, not `reset`.** `reset` only clears the boundary on the client, so a server
  component that threw re-renders the same cached error; `retry` refreshes the route first.
