# ListCardsGrid

Responsive grid for custom-list tiles (`ListCard`). It is a container-query grid: 2 columns by
default, 3 from `$screenSm` and 6 from 960px of its own width.

## When to use

- Any grid of `ListCard`s: the profile's lists, the lists block on `UserInfo`, the `/lists`
  page.
- For game covers use `GamesCards`, which snaps its columns to the page size.

## API

| Prop        | Type        | Default | Purpose                          |
| ----------- | ----------- | ------- | -------------------------------- |
| `children`  | `ReactNode` | —       | The tiles                        |
| `className` | `string`    | —       | Extra class on the outer wrapper |

## Usage

```tsx
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { ListCard } from "@/src/lib/shared/ui/ListCard";

<ListCardsGrid>
  {lists.map((list) => (
    <ListCard key={list._id} list={list} />
  ))}
</ListCardsGrid>;
```

## Rules and gotchas

- **The column count follows the wrapper's width, not the viewport.** The wrapper sets
  `container-type: inline-size`, so in a narrow column it stays at 2 columns on a wide screen.
- **Keep the paged list size divisible by every column count (2, 3, 6).** A page size that is not
  (the lists page uses 24) leaves a ragged last row.
- The thresholds are literal values in the module because a container query cannot read a CSS
  custom property; change them together with the card width.

## Storybook

`Shared/ListCardsGrid` — `Default`, `FewItems`.
