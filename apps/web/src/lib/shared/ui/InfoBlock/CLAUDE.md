# InfoBlock

A labelled block of facts: a small heading ("HowLongToBeat:", "Links:", "Ratings:") over any
content, wrapped in its own `Box` with `--padding-x3` unless told otherwise.

## When to use

- A compact side-panel block on a detail page — tiles, a list of chips, rating rows — that needs
  a caption and its own panel.
- `isBoxed={false}` when the block already sits inside a `Box` together with its neighbours (a
  grouped side column, a modal).
- Not for a page section heading — that is `SectionTitle`; not for a single figure — that is
  `StatTile`.

## API

| Prop        | Type                           | Default | Purpose                                                                 |
| ----------- | ------------------------------ | ------- | ----------------------------------------------------------------------- |
| `title`     | `ReactNode`                    | —       | Caption, 16/20px, `--color-text-primary`; rendered as given             |
| `children`  | `ReactNode`                    | —       | Block content, placed under the title with a `--gap-x2` gap             |
| `isBoxed`   | `boolean`                      | `true`  | Wraps the block in `Box` with `contentStyle.padding: var(--padding-x3)` |
| `as`        | `"h2" \| "h3" \| "h4" \| "h5"` | `"h4"`  | Tag of the title                                                        |
| `className` | `string`                       | —       | Extra class on the inner `section` (not on the `Box`)                   |

## Usage

```tsx
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";

<InfoBlock title="HowLongToBeat:" isBoxed={isBoxed}>
  <div className={styles.tiles}>
    {tiles.map((tile) => (
      <StatTile
        key={tile.label}
        label={tile.label}
        value={tile.amount}
        hint={tile.unit}
        align="center"
        isLabelBelow
      />
    ))}
  </div>
</InfoBlock>;
```

## Rules and gotchas

- **The title is rendered exactly as passed** — the trailing colon of the game page blocks is
  part of the copy, not added by the component.
- **The content's own layout is the consumer's.** The block is a flex column with one gap
  between the title and `children`; a grid of tiles or a row of chips brings its own wrapper.
  A block that needs a wider gap between its rows sets it on that wrapper, not on the
  `InfoBlock`.
- `isBoxed` defaults to `true`, matching the game page blocks it replaces; the panel follows the
  layout rule that every block on a page sits in a `Box`.
- Imports `Box`, which uses hooks, so it renders inside client components only.

## Storybook

`Shared/InfoBlock` — `Boxed`, `Unboxed`, `WithText`, `WithBadges`, `LongTitle`.
