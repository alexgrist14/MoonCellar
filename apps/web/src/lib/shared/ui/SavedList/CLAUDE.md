# SavedList

A list of named saved entries, each row a full-width button that applies it plus a red Remove
button. Used for saved filter presets in `Filters` and saved royal-game sets in
`RoyalGamesPanel`.

## When to use

- Showing user-saved presets that can be applied or deleted.
- Not for general lists of links or data — that is `Table` or plain markup.

## API

| Prop        | Type                                                            | Default | Purpose                                       |
| ----------- | --------------------------------------------------------------- | ------- | --------------------------------------------- |
| `items`     | `{ name: string; onApply: () => void; onRemove: () => void }[]` | `[]`    | Rows to render.                               |
| `isLoading` | `boolean`                                                       | —       | Three `Skeleton` rows of the real row height. |

## Usage

```tsx
import { SavedList } from "@/src/lib/shared/ui/SavedList";

<SavedList
  items={savedFilters.map((filter) => ({
    name: filter.name,
    onApply: () => applyFilter(filter),
    onRemove: () => removeFilter(filter.name),
  }))}
/>;
```

## Rules and gotchas

- **`name` is the React key,** so names must be unique within the list.
- **Empty `items` renders an empty `<ul>`, not a placeholder.** The consumer shows its own empty
  state. While the presets load, pass `isLoading` instead of a spinner of your own.
- The Remove button is the shared `Button` without a `type`; inside a `<form>` it submits it.
- Long names are cut with an ellipsis; the row height is tied to `--community-avatar-size`.
- **The apply target stays a native `<button>`.** It is the whole row, laid out as a `subgrid` across the item's columns, not a button-shaped control; only the delete action is a `Button`.

## Storybook

`Shared/SavedList`: `Default`, `LongName`, `Empty`, `Loading`.
