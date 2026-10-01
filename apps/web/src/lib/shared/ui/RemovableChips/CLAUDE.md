# RemovableChips

A wrapped list of chips the user can remove one by one, with an optional "Clear all" button at
the end. It holds no state: the caller owns the list and decides what removing an item means.

## When to use

- Showing picked entries that can be dropped again (the request form's selected games,
  companies or platforms, a character's linked games).
- Showing applied filters — through `AppliedFilters`, which is this component with
  `variant="pill"`.
- Not for static tags or links — use `Chip`.
- Not for switching between options — use `Tabs`.

## API

| Prop             | Type                               | Default                      | Purpose                                                                   |
| ---------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `items`          | `IRemovableChip[]`                 | —                            | Chips to render, each `{ id, label, href? }`.                             |
| `onRemove`       | `(id: string) => void`             | —                            | Called with the item's `id` when it is removed.                           |
| `variant`        | `"chip" \| "pill"`                 | `"chip"`                     | `chip`: `Chip` with a red × button. `pill`: the whole pill is the button. |
| `clearAllLabel`  | `string`                           | `"Clear all"`                | Text of the clear button.                                                 |
| `onClearAll`     | `() => void`                       | —                            | Shows the clear button after the last chip.                               |
| `getRemoveLabel` | `(item: IRemovableChip) => string` | `` `Remove ${item.label}` `` | `aria-label` of each remove button.                                       |
| `isDisabled`     | `boolean`                          | —                            | Disables every remove button and the clear button (e.g. while saving).    |
| `className`      | `string`                           | —                            | Extra class on the `<ul>`.                                                |

`IRemovableChip` is exported from the barrel. `href` makes the label a link (`chip` variant
only; a `pill` is a single button and ignores it).

## Usage

```tsx
import { RemovableChips } from "@/src/lib/shared/ui/RemovableChips";

<RemovableChips
  items={games}
  isDisabled={isSaving}
  onRemove={(id) => setGames((prev) => prev.filter((game) => game.id !== id))}
  onClearAll={() => setGames([])}
/>;
```

## Rules and gotchas

- Renders `null` for an empty list, so mount it unconditionally.
- `id`s must be unique within the list: they are the React keys and what `onRemove` reports.
- Every button is `type="button"`, so it is safe inside a `<form>`.
- No hooks and no `"use client"`, but `onRemove` is a function prop: render it from a client
  component.

## Storybook

`Shared/RemovableChips` — `Default`, `WithLinks`, `WithClearAll`, `Pill`, `Disabled`,
`LongLabels`, `Empty`.
