# MobileTable

The phone layout of `Table`: every row becomes a card that shows one head field and expands to
list the remaining fields as label/value pairs. It adds its own "Sort by"/"Sort order" dropdowns,
client-side pagination through the shared `Pagination` (only over `limit` cards), skeleton cards while loading and a "List is empty" state.

## When to use

- Never directly. `Table` renders it by itself when `useStatesStore().isMobile` is true and the
  table has `mobileHeadField`; pass that prop to `Table` and the mobile layout comes for free.
- Not for a desktop table or a hand-written `<table>` — every table is `Table`.

## API

| Prop                     | Type                                  | Default | Purpose                                                                               |
| ------------------------ | ------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `mobileHeadField`        | `keyof T`                             | —       | Cell shown in the collapsed card header; rows without it are skipped.                 |
| `rows`                   | `ITableRows<T>`                       | —       | Rows of `ITableCell`s; `undefined` and `[]` show "List is empty".                     |
| `isLoading`              | `boolean`                             | —       | Shows skeleton cards (held for a minimum time by `useMinimumLoading`).                |
| `initialSortingKey`      | `keyof T`                             | —       | Field sorted by on mount; without it rows keep their order.                           |
| `limit`                  | `number`                              | `50`    | Cards per page; the same default as `Table`, so a server page never gets a 2nd pager. |
| `isWithoutMobileSorting` | `boolean`                             | —       | Hides the two sort dropdowns.                                                         |
| `onRowClick`             | `(rowIndex: number) => void`          | —       | Called with the row's index in `rows` when a card head is clicked.                    |
| `getRowClassName`        | `(row, index) => string \| undefined` | —       | Class added to a row's card; `index` is the row's in `rows`. `Table` forwards it.     |

Per cell (`ITableCell`), the mobile layout reads `content`, `title` (the field label; `Table`
copies the header content into it), `sortingValue`, `className`, `onClick` and `id`.

## Usage

```tsx
import { Table } from "@/src/lib/shared/ui/Table";

<Table
  headers={headers}
  rows={rows}
  isLoading={isLoading}
  mobileHeadField="name"
  initialSortingKey="date"
/>;
```

## Rules and gotchas

- Sorting is client-side over the rows it was given; `Table` hides the dropdowns
  (`isWithoutMobileSorting`) whenever the server sorts through `sortingCallback`, and so should
  any direct use.
- A field label falls back to the key with its first letter upper-cased when the first row's
  cell has no string `title` — set `title` on cells when `rows` are built by hand.
- `onClick` and `className` are applied only to the head cell. A row that opens a page passes
  `onRowClick` to `Table`, which forwards it: clicking the card head calls it with the row's
  index in `rows` (not its sorted position), after the head cell's own `onClick`.
- Sorting uses `compareTableCells` from `shared/utils/table.utils`, the same comparator as
  `Table`, so both layouts order rows identically.
- Expanded cards are tracked by the head cell's `id`, falling back to its string or number
  `content`, so an open card stays open across a re-sort. A head cell whose `content` is a node
  and has no `id` falls back to the row's position — give such cells an `id`, and keep head texts
  unique or the duplicates open and close together.
- The sort dropdowns use `isThroughPortal`, so they need `#dropdown-connector`; the pager needs
  nothing extra.

## Storybook

`Shared/MobileTable` — `Default`, `SortedByDate`, `SortedByTime`, `WithoutSorting`, `Paginated`,
`RowClick`, `Loading`, `Empty`, `WithoutRows`, `DimmedRows`.
