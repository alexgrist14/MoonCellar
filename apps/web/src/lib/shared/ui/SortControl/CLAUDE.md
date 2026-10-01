# SortControl

A sort field: a `Dropdown` with the sort keys and a square chevron `Button` beside it that
flips the order between ascending and descending. With `label` it is wrapped in a
`FilterGroup` (`h4` above the row).

## When to use

- Any "sort by X, ascending/descending" control: the `/games` filters, the `/lists` filters,
  a custom list's game sort.
- A short row of exclusive sort modes without an order (comments Top/New) is `Tabs` with
  `theme="segmented"`.

## API

| Prop              | Type                                                      | Default | Purpose                                                                       |
| ----------------- | --------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `options`         | `ISortControlOption<T>[]` (`{ value: T; label: string }`) | —       | Sort keys, in display order.                                                  |
| `sortBy`          | `T \| undefined`                                          | —       | Current key; `undefined` shows the placeholder and disables the order button. |
| `sortOrder`       | `ISortOrder` (`"asc" \| "desc"`)                          | —       | Current order. `asc` points the chevron up.                                   |
| `onChange`        | `(sortBy: T \| undefined, sortOrder: ISortOrder) => void` | —       | Fires with both values on every change; `undefined` only after a reset.       |
| `label`           | `string`                                                  | —       | Heading above the row (renders a `FilterGroup`).                              |
| `placeholder`     | `string`                                                  | —       | Dropdown text while `sortBy` is unset.                                        |
| `isDisabled`      | `boolean`                                                 | —       | Disables the dropdown and the order button.                                   |
| `isWithReset`     | `boolean`                                                 | —       | Dropdown Reset button; resetting calls `onChange(undefined, sortOrder)`.      |
| `isThroughPortal` | `boolean`                                                 | `true`  | Passed to `Dropdown`. Set `false` only where the inline list is known to fit. |
| `overflowRootId`  | `string`                                                  | —       | Passed to `Dropdown`: the container whose bottom the list must not cross.     |
| `className`       | `string`                                                  | —       | Class on the outermost element (the `FilterGroup` when `label` is set).       |

`T` is inferred from `options`, so `onChange` receives the domain's own sort union.

## Usage

```tsx
import { SortControl } from "@/src/lib/shared/ui/SortControl";

<SortControl
  label="Sort by"
  options={LIST_GAMES_SORT_OPTIONS}
  sortBy={sortBy}
  sortOrder={sortOrder}
  isDisabled={isLoading}
  onChange={(by, order) =>
    setSort({ sortBy: by ?? "position", sortOrder: order })
  }
/>;
```

## Rules and gotchas

- It is fully controlled: the chevron and the dropdown show only what the parent passes back.
- The order button is disabled while `sortBy` is unset — an order with no key means nothing,
  which is the `/games` behaviour this replaces.
- The dropdown takes the row's remaining width (`flex: 1; min-width: 0`) and keeps its own
  `min-width: 170px`, so the control needs at least that plus the button.
- The order button's accessible name and tooltip are "Ascending"/"Descending", the current
  order. Earlier copies used a colourless `ToggleSwitch` with chevrons, which had no
  accessible name.
- Inside a modal or a scrolling panel keep `isThroughPortal` on (the default) — an inline list
  is clipped by any `overflow` ancestor.

## Storybook

`Shared/SortControl`: `Default`, `WithLabel`, `Resettable`, `Descending`, `Disabled`.
