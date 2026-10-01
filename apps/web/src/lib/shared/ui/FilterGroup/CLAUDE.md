# FilterGroup

One section of a filter panel: an `h4` title, an optional control on the right of the title
(the any/all toggle), and the filter control below it.

## When to use

- Every labelled block inside a filter panel (`/games` filters, `/lists` filters): a
  `Dropdown`, an `Input`, a range, a date row under a heading.
- Not for page sections — those are `SectionTitle` inside a `Box`.
- A sort dropdown with its order toggle is `SortControl`, which renders a `FilterGroup` itself
  when it gets `label`.

## API

| Prop           | Type        | Default | Purpose                                                 |
| -------------- | ----------- | ------- | ------------------------------------------------------- |
| `title`        | `ReactNode` | —       | Heading text, rendered as `h4`.                         |
| `headerAction` | `ReactNode` | —       | Control placed on the right of the heading, same row.   |
| `children`     | `ReactNode` | —       | The filter control(s).                                  |
| `className`    | `string`    | —       | Extra class on the root (grid with `--gap-x1` row gap). |

## Usage

```tsx
import { FilterGroup } from "@/src/lib/shared/ui/FilterGroup";

<FilterGroup title="Genres" headerAction={renderModeToggle("genres")}>
  <Dropdown isMulti isWithReset list={genres} />
</FilterGroup>;
```

## Rules and gotchas

- The spacing between groups belongs to the parent panel (the filter panels use a grid with
  `--gap-x5`); the group only spaces its own title from its control.
- Without `headerAction` the `h4` is a direct child of the grid, with it the heading row is a
  flex row with `justify-content: space-between` — the same markup the hand-rolled
  `filters__wrapper`/`filters__header` pair produced.
- No `"use client"` and no hooks: it can render anywhere.

## Storybook

`Shared/FilterGroup`: `Default`, `WithHeaderAction`, `Stacked`.
