# Loader

A centred `react-spinners` animation in the accent colour. It is absolutely positioned in the
middle of its nearest positioned ancestor and ignores pointer events.

## When to use

- Inline loading state of a block (`Table`, `RangeSelector`, video thumbnails).
- A block that is only a loading placeholder: `isBlock` or `minHeight` (block mode) — never a
  hand-written `<div className={styles.loading}>` with `position: relative; min-height`.
- For a full-page loader use `PageLoader`, which wraps it with `type="moon"`.
- Inside a button use `Button`'s `isLoading`.

## API

| Prop              | Type                                           | Default       | Purpose                                                                                |
| ----------------- | ---------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `type`            | `"pulse" \| "propogate" \| "pacman" \| "moon"` | `"pulse"`     | Spinner style (note the `propogate` spelling).                                         |
| `color`           | `string`                                       | `accentColor` | Spinner colour.                                                                        |
| `speedMultiplier` | `number`                                       | —             | Animation speed.                                                                       |
| `size`            | `number \| string`                             | spinner's own | Spinner size (`react-spinners` `size`; `em` works).                                    |
| `isBlock`         | `boolean`                                      | —             | Block mode: renders its own positioned, full-width box of `--loader-block-min-height`. |
| `minHeight`       | `string`                                       | —             | Block mode with this min height (implies `isBlock`).                                   |
| `className`       | `string`                                       | —             | Extra class on the spinner, or on the block in block mode.                             |

## Usage

```tsx
import { Loader } from "@/src/lib/shared/ui/Loader";

{
  isLoading ? <Loader isBlock /> : <GamesList games={games} />;
}

{
  isLoading ? <Loader minHeight="var(--padding-x20)" /> : <CharacterForm />;
}

<div className={styles.overlayHost}>
  <Chart />
  {isFetching && <Loader />}
</div>;
```

## Rules and gotchas

- **Block mode carries its own `position: relative`, `width: 100%`, min height and
  `text-align: start`,** so it is safe under any parent and inside a centred container; it also
  sets `role="status"` and `aria-busy`. Only the default (overlay) mode has the two gotchas below.
- **In overlay mode the parent needs `position: relative` and a height.** The loader is `position: absolute`
  at 50%/50%; without a positioned ancestor it centres on the page, and in a zero-height box it
  overlaps whatever follows.
- **Keep its `text-align: start`.** `PacmanLoader` places its body halves with no `left`, so an
  inherited `text-align: center` pushes the body right while the dots fly past the mouth.
- **Gate it on React Query's `isLoading`, never `isPending` or `isFetching`.** A disabled query
  stays `pending` forever (endless spinner), and `isFetching` is true on background refetches
  (cached data swapped for a spinner).
- `color` takes a raw colour string because `react-spinners` paints it inline; prefer the
  constants in `shared/constants` over a new hex.

## Storybook

`Shared/Loader`: `Pulse`, `Propagate`, `Pacman`, `Moon`, `CustomColor`, `Small`, `Block`,
`BlockMinHeight`.
