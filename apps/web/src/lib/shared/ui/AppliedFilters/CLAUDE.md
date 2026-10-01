# AppliedFilters

A wrapped row of removable pills showing which filters are applied, followed by a "Clear all"
link button. It holds no filter state: the page derives the pills from its query and decides
what removing one means.

## When to use

- Above a filtered list, to show and remove the active filters (`/games` through
  `AppliedGameFilters`, `/lists` in `ListsPage`).
- Not for static tags or links — use `Chip`.
- Not for switching between mutually exclusive options — use `Tabs`.

## API

| Prop         | Type               | Default | Purpose                                           |
| ------------ | ------------------ | ------- | ------------------------------------------------- |
| `filters`    | `IAppliedFilter[]` | —       | Pills to render, each `{ key, label, onRemove }`. |
| `onClearAll` | `() => void`       | —       | Called by the "Clear all" button.                 |
| `className`  | `string`           | —       | Extra class on the row.                           |

`IAppliedFilter` is exported from the barrel: `key` is the React key, `label` the visible text,
`onRemove` runs when the pill is clicked.

## Usage

```tsx
import {
  AppliedFilters,
  IAppliedFilter,
} from "@/src/lib/shared/ui/AppliedFilters";

const applied: IAppliedFilter[] = params.genres.map((genre) => ({
  key: `genre-${genre}`,
  label: genre,
  onRemove: () =>
    pushListsQuery({
      ...params,
      genres: params.genres.filter((g) => g !== genre),
    }),
}));

<AppliedFilters
  filters={applied}
  onClearAll={() =>
    pushListsQuery({ sortBy: params.sortBy, sortOrder: params.sortOrder })
  }
/>;
```

## Rules and gotchas

- Mount it unconditionally; it returns `null` for an empty list, so wrapping it in a length check
  is redundant.
- Keep the URL as the only filter state: derive `filters` from the parsed query and push the
  query back in `onRemove`/`onClearAll`, as `/games` and `/lists` do — a local copy drifts from
  the address bar.
- "Clear all" must keep `sortBy`/`sortOrder`; sorting is not a filter and dropping it resets the
  user's order.
- Removing the last value of a category must also drop its `mode.<category>` entry, or the
  any/all toggle lingers in the URL.
- Platform filters hold platform `_id`s; map them back through `useCommonStore().systems` before
  building `label`, or a raw ObjectId appears in the pill.
- Every pill is a `type="button"` with `aria-label="Remove filter <label>"`, so it is safe inside
  a `<form>` and announced as a removal.
- It is a thin binding over `RemovableChips` with `variant="pill"`; change the pill look there,
  not here. Filter `key`s must be unique — they become the chip ids.

## Storybook

`Shared/AppliedFilters` — `Default`, `Single`, `LongLabels`, `Empty`.
