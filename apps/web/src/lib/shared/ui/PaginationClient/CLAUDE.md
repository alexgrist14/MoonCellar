# PaginationClient

"Show more" / "Collapse" buttons for a list that is already fully loaded on the client. It only
moves a page counter; the parent slices its array to `page * take`. Used by `Table` and
`MobileTable`.

## When to use

- Growing a client-side list in steps (table rows, mobile cards).
- For server pagination with page numbers use `Pagination`.

## API

| Prop          | Type                               | Default | Purpose                                       |
| ------------- | ---------------------------------- | ------- | --------------------------------------------- |
| `take`        | `number`                           | —       | Items added per step.                         |
| `page`        | `number`                           | —       | Current step (1-based).                       |
| `setPage`     | `Dispatch<SetStateAction<number>>` | —       | Page setter.                                  |
| `length`      | `number`                           | —       | Total item count; renders nothing when falsy. |
| `isWithQuery` | `boolean`                          | —       | Also sets `?page=` in the URL.                |

## Usage

```tsx
import { PaginationClient } from "@/src/lib/shared/ui/PaginationClient";

const [page, setPage] = useState(1);
const visible = rows.slice(0, page * take);

<PaginationClient
  page={page}
  setPage={setPage}
  take={take}
  length={rows.length}
/>;
```

## Rules and gotchas

- **The parent does the slicing.** The component never touches the data; forgetting the
  `slice(0, page * take)` makes both buttons no-ops.
- **"Show more" is hidden once `page * take >= length`, "Collapse" appears from page 2** and
  resets to page 1.
- **`isWithQuery` sets `page` with `window.history.pushState`, keeping the other query params**
  and without a server render or scroll. It only mirrors the counter: the component never reads
  `?page=` back, so the parent seeds its initial `page` from the URL itself if it needs to.
- The buttons have no `type`; do not render it inside a `<form>`.
- No `"use client"` and it touches `window` in its handlers: import it from a client component
  only.

## Storybook

`Shared/PaginationClient`: `Default`, `MiddlePage`, `LastPage`, `FitsOnePage`, `WithQuery`.
