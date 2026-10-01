# Pagination

Page switcher with first/previous/next/last buttons and a number input for jumping to a page.
Inline mode wraps it in a `<nav>` with "Page X of Y" and "Showing a–b of N"; fixed mode portals
the bare control into `#pagination-connector` so it floats at the bottom of the screen.

## When to use

- Any paged list: the games catalogue, `/lists`, a custom list, the profile activity feed.
- Not for "load more" or infinite lists.

## API

| Prop               | Type                             | Default | Purpose                                                 |
| ------------------ | -------------------------------- | ------- | ------------------------------------------------------- |
| `total`            | `number`                         | —       | Total item count; `0` renders nothing                   |
| `take`             | `number`                         | —       | Page size                                               |
| `page`             | `number`                         | —       | Controlled page; omit to read/write `?page=` in the URL |
| `onPageChange`     | `(page: number) => void`         | —       | Called in controlled mode                               |
| `callback`         | `(page: number) => void`         | —       | Extra callback after any change, in both modes          |
| `isFixed`          | `boolean`                        | `false` | Portal into `#pagination-connector` instead of inline   |
| `isDisabled`       | `boolean`                        | `false` | Dims and blocks the control (while loading)             |
| `scrollTargetRef`  | `RefObject<HTMLElement \| null>` | —       | Element to scroll into view on change; else page top    |
| `isWithoutSummary` | `boolean`                        | `false` | Inline mode without the two summary lines               |

## Usage

```tsx
import { Pagination } from "@/src/lib/shared/ui/Pagination";

<Pagination
  take={takeGames}
  total={total}
  isFixed
  isDisabled={isLoading}
  page={params.page}
  onPageChange={changePage}
/>;
```

## Rules and gotchas

- **The uncontrolled mode sets `?page=` with `window.history.pushState`, keeping every other
  query param.** `useSearchParams` updates at once and no server render runs, so a list keyed
  on `?page=` through React Query refetches immediately. Use controlled mode when the page lives
  in state or the URL needs more than `page` changed at once.
- **`isFixed` needs `#pagination-connector` in the DOM.** `Layout` renders it; the connector is
  looked up in `useEffect`, so the fixed control appears one render after mount and never on the
  server — keep page content independent of it.
- **Scrolling goes to `#page-scroll`, not `window`,** via `scrollPageToTop`; pass
  `scrollTargetRef` when the list sits mid-page (activity feed).
- The component carries no `"use client"`; render it from a client component, never directly
  from a route file.
- The input commits on blur (Enter or Escape blurs it) and clamps to `1…last page`; an empty or
  non-numeric value, or the current page, changes nothing and restores the current page.

## Storybook

`Shared/Pagination` — `Inline`, `WithoutSummary`, `LastPage`, `Disabled`, `Fixed`, `Uncontrolled`.
