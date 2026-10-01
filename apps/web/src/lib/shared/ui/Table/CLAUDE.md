# Table

The shared data table: column-based (or, with `layout="rows"`, row-aligned grid) layout with header sorting, drag-resizable columns,
client-side pagination, a loader and an empty state. On mobile, with `mobileHeadField`, it
switches to `MobileTable` — one card per row with that field as the card head.

## When to use

- Every tabular list, admin lists above all. Never a hand-written `<table>`: that silently
  loses resizing, sorting, the mobile layout and the shared loader/empty state.
- A list of rich cards (games, users) is a grid of cards, not a table.

## API

`T` is the row shape: each key is a column, each value an `ITableCell`
(`shared/types/table.type`).

| Prop                     | Type                                      | Default     | Purpose                                                                                  |
| ------------------------ | ----------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `headers`                | `ITableHeaders<T>`                        | —           | One cell per column; key order is column order.                                          |
| `rows`                   | `ITableRows<T>`                           | —           | Data rows. `undefined` and `[]` show "List is empty"; the loader is `isLoading`.         |
| `columnStyles`           | `Partial<Record<keyof T, CSSProperties>>` | —           | Per-column style; `width` becomes the flex basis.                                        |
| `initialSortingKey`      | `keyof T`                                 | —           | Column sorted on mount.                                                                  |
| `initialSortingOrder`    | `"asc" \| "desc"`                         | `"desc"`    | Initial order.                                                                           |
| `sortingCallback`        | `(key, order) => void`                    | —           | Server-side sorting: rows are shown as given and the callback reports header clicks.     |
| `isLoading`              | `boolean`                                 | —           | Shows the loader (kept for a minimum time).                                              |
| `limit`                  | `number`                                  | `50`        | Rows per client page.                                                                    |
| `mobileHeadField`        | `keyof T`                                 | —           | Enables the mobile card layout; this field heads each card.                              |
| `isWithoutMobileSorting` | `boolean`                                 | —           | Hides the sort control in the mobile layout (always hidden with `sortingCallback`).      |
| `id`                     | `string`                                  | `"0"`       | Prefix of the column DOM ids used for resizing.                                          |
| `onRowClick`             | `(rowIndex: number) => void`              | —           | Makes whole rows clickable (pointer cursor); gets the row's index in `rows`.             |
| `rowClickExcludeKeys`    | `(keyof T)[]`                             | —           | Columns whose cells do not trigger `onRowClick` (actions, toggles, role pickers).        |
| `isWithoutSorting`       | `boolean`                                 | —           | Header clicks do nothing and no arrow shows; rows keep their order (mobile too).         |
| `getRowClassName`        | `(row, index) => string \| undefined`     | —           | Class added to every cell of a row (the card on mobile); `index` is the row's in `rows`. |
| `layout`                 | `"columns" \| "rows"`                     | `"columns"` | `"rows"`: one CSS grid, all cells of a row share one height. See below.                  |

`ITableCell`: `content` (string or node), `sortingValue` (used instead of `content` when
sorting), `onClick`, `className`, `style`, `id`, `isHidden` (a hidden header hides the column),
`isNotResizable` (header only), `title` (filled automatically for the mobile layout), `link`.

## Usage

```tsx
import { Table } from "@/src/lib/shared/ui/Table";

<Table
  mobileHeadField="name"
  isLoading={isLoading}
  initialSortingKey="rating"
  columnStyles={{ name: { width: "240px", minWidth: "180px" } }}
  headers={{ name: { content: "Game" }, rating: { content: "Rating" } }}
  onRowClick={(index) => open(games[index])}
  rowClickExcludeKeys={["actions"]}
  rows={games?.map((game) => ({
    name: { content: game.name },
    rating: { content: `${game.rating}%`, sortingValue: game.rating },
    actions: { content: <ActionsMenu game={game} /> },
  }))}
/>;
```

## Rules and gotchas

- The default `columns` layout renders each column as its own flex column, so cells of
  different heights in one row drift apart. When a row's cells must line up (multi-line text,
  lists, chips — the request field diff), pass `layout="rows"`: one CSS grid whose tracks come
  from `columnStyles` as `minmax(minWidth ?? 80px, width ?? 1fr)` (any track size works for
  `width`, e.g. `48px` or `max-content`; other `columnStyles` keys are ignored), each row a
  `display: contents` wrapper with ARIA table roles, cells stretched to the row height with
  content at the top, and string content wrapping instead of being cut with an ellipsis.
  Resizing, hover, loader, empty state, pagination and the mobile layout work as in `columns`.
- `getRowClassName`'s class lands on each cell, not on a row element (in `rows` the row wrapper
  is `display: contents` and draws nothing), so target one column with a compound selector:
  `.row_off.new { opacity: 0.45 }`.
- `isWithoutSorting` also ignores `initialSortingKey` and hides the mobile sort dropdowns.

- Size columns through `columnStyles` with a `width` and a `minWidth`, so one long column
  cannot squeeze the other headers.
- A row that opens a page is clickable as a whole: pass `onRowClick` instead of the same
  `onClick` on every cell, list interactive columns in `rowClickExcludeKeys`, and stop
  propagation on links inside the row. Do not add an "Open"/"Edit" column; destructive actions
  stay buttons.
- `onRowClick` receives the row's index in the `rows` array you passed, not its visual
  position: the table maps it back through its own sorting, so `rows[index]` is always the
  clicked row. A cell's own `onClick` still fires first. In the mobile layout the card head
  triggers it.
- Pass `sortingValue` for anything that is not a plain string. Sorting goes through
  `compareTableCells` (`shared/utils/table.utils`), shared with `MobileTable`: it compares
  `sortingValue ?? content`, numbers numerically and strings with `localeCompare`, and puts a
  cell without a string or number value (a node `content` and no `sortingValue`) last in both
  orders.
- With `sortingCallback`, the table does not sort locally — the caller must refetch.
- Pass `isLoading` while the rows are being fetched: `rows={undefined}` alone renders the empty
  state, not the loader.
- Pagination is client-side over `rows`; for a server-paginated list pass one page of rows
  and render the shared `Pagination` beside it, as `ConflictList` does.
- The mobile layout is chosen from `useStatesStore().isMobile`, set by the app's layout; it
  passes `MobileTable` copies of the row cells with each header's `content` as their `title`,
  and leaves the objects you pass untouched.
- Uses hooks and a zustand store, and has no `"use client"`: import it from a client
  component only.

## Storybook

`Shared/Table`: `Default`, `ClickableRows`, `RowClick`, `ServerSorting`, `Loading`, `Empty`, `WithoutRows`,
`ZeroAndMissingValues`, `Mobile`, `WithoutSorting`, `DimmedRows`, `RowLayout`.
