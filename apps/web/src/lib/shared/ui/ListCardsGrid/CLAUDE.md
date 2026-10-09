# ListCardsGrid

Responsive grid for custom-list tiles (`ListCard`). It fits as many columns of at least
`--list-card-min-width` (180px, the size of a game card) as its own width allows, and never fewer
than two, so a tile is the same size in the profile's narrow column and on the wide `/lists` page.

## When to use

- Any grid of `ListCard`s: the profile's lists, the lists block on `UserInfo`, the `/lists`
  page.
- For game covers use `GamesCards`, which snaps its columns to the page size.

## API

| Prop        | Type        | Default | Purpose                                                                                                                     |
| ----------- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode` | —       | The tiles                                                                                                                   |
| `maxRows`   | `number`    | —       | Shows only that many whole rows at the current column count; the rest stay in the DOM, `hidden` (a profile preview shows 2) |
| `isLoading` | `boolean`   | —       | Marks the grid as a loading `status`; pass `ListCardSkeleton`s as the children                                              |
| `className` | `string`    | —       | Extra class on the outer wrapper                                                                                            |

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

- **The column count follows the grid's width, not the viewport**, through `auto-fill` and
  `--list-card-min-width`. Breakpoints on the container width made the profile's lists tab three
  columns wide while `/lists` had six, so the same tile was half again as large on the profile.
- **The minimum is `min(--list-card-min-width, half the row)`,** which keeps two columns on a
  phone, where two 180px tiles do not fit.
- The column count is not fixed, so a paged list can end in a short last row; that is expected.

## Storybook

`Shared/ListCardsGrid` — `Default`, `FewItems`, `TwoRows`, `GameSized`, `Loading`.
