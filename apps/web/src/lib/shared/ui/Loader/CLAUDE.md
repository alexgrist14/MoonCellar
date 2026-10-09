# Loader

A centred `react-spinners` animation in the accent colour. It is absolutely positioned in the
middle of its nearest positioned ancestor and ignores pointer events.

## When to use

- Only for an action in progress over content that is already on screen: `Button`'s
  `isLoading`, a comment being deleted or posted, a review list refreshing behind its filters,
  a rating being saved, the wheel spinning, an image being regenerated over its old preview.
- **Never as the placeholder of content that is still loading** — a list, a grid, a panel, a
  page, an image. That is `Skeleton` (or a component's own skeleton built on it, such as
  `GameCardSkeleton`, `ListCardSkeleton` or `PageSkeleton`), shaped like the content it stands
  for, so nothing jumps when the data arrives.
- Inside a button use `Button`'s `isLoading`.

## API

| Prop              | Type                                           | Default       | Purpose                                             |
| ----------------- | ---------------------------------------------- | ------------- | --------------------------------------------------- |
| `type`            | `"pulse" \| "propogate" \| "pacman" \| "moon"` | `"pulse"`     | Spinner style (note the `propogate` spelling).      |
| `color`           | `string`                                       | `accentColor` | Spinner colour.                                     |
| `speedMultiplier` | `number`                                       | —             | Animation speed.                                    |
| `size`            | `number \| string`                             | spinner's own | Spinner size (`react-spinners` `size`; `em` works). |
| `className`       | `string`                                       | —             | Extra class on the spinner.                         |

## Usage

```tsx
import { Loader } from "@/src/lib/shared/ui/Loader";

<article className={classNames(styles.entry, { [styles.busy]: isDeleting })}>
  {isDeleting && <Loader type="pulse" className={styles.busy__loader} />}
  <RichText html={comment.body} />
</article>;
```

## Rules and gotchas

- **The parent needs `position: relative` and a height.** The loader is `position: absolute` at
  50%/50%; without a positioned ancestor it centres on the page, and in a zero-height box it
  overlaps whatever follows.
- **Keep its `text-align: start`.** `PacmanLoader` places its body halves with no `left`, so an
  inherited `text-align: center` pushes the body right while the dots fly past the mouth.
- **There is no block mode any more.** `isBlock` and `minHeight` rendered a spinner as the
  placeholder of a loading block; every such place now renders a skeleton of the block instead,
  and a spinner there would bring back the layout jump when the data lands.
- `color` takes a raw colour string because `react-spinners` paints it inline; prefer the
  constants in `shared/constants` over a new hex.

## Storybook

`Shared/Loader`: `Pulse`, `Propagate`, `Pacman`, `Moon`, `CustomColor`, `Small`.
