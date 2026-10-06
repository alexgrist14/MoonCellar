# StatTile

A bordered tile with a small muted label over a large number: profile counters, a game's
"Beaten by / Playing now" counters. Clickable when given `onClick`.

## When to use

- A single figure with a caption, usually several side by side in a grid the consumer lays out.
- `onClick` when the tile opens what it counts (the profile's Games tab, the followers drawer).
- Not for a list of labelled figures in a side column — that is `StatRows`.
- Not for a status word — that is `Badge`; not for a labelled block of arbitrary content — that
  is `InfoBlock`.

## API

| Prop           | Type                                             | Default   | Purpose                                                                                                                     |
| -------------- | ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `label`        | `ReactNode`                                      | —         | Caption, `--color-text-muted` 12px; omitted, the tile shows only the value (when the block's heading already names it)      |
| `value`        | `ReactNode`                                      | —         | The figure, 20/26px bold, tabular numbers; format it before passing                                                         |
| `hint`         | `ReactNode`                                      | —         | Small secondary line under the value (a unit: "hours")                                                                      |
| `children`     | `ReactNode`                                      | —         | Rendered at the right end of the value row (an avatar stack)                                                                |
| `valueColor`   | `string`                                         | —         | CSS colour of the value, e.g. `"var(--game-completed-color)"`                                                               |
| `align`        | `"start" \| "center"`                            | `"start"` | Text alignment                                                                                                              |
| `isLabelBelow` | `boolean`                                        | `false`   | Moves the label under the value (and the hint)                                                                              |
| `onClick`      | `(event: MouseEvent<HTMLButtonElement>) => void` | —         | Renders a `button type="button"` with a hover/focus ring instead of a `div`                                                 |
| `className`    | `string`                                         | —         | Extra class                                                                                                                 |
| `...rest`      | `HTMLAttributes<HTMLElement>`                    | —         | `data-*`, `aria-*`, `title`, `style`… reach the root element                                                                |

## Usage

```tsx
import { StatTile } from "@/src/lib/shared/ui/StatTile";

<StatTile label="Games" value={formatCount(gamesCount)} onClick={() => goTo("all")} />

<StatTile
  label="Followers"
  value={formatCount(followers.length)}
  onClick={() => openPeople("followers")}
  {...triggerProps}
>
  <PeopleStack people={followers} />
</StatTile>

<StatTile label="Beaten by" value={formatCount(stats.completed)} valueColor="var(--game-completed-color)" />

```

## Rules and gotchas

- **The tile does not lay itself out.** Wrap several in the consumer's own grid
  (`repeat(n, minmax(0, 1fr))`); the tile has `min-width: 0` so long values shrink instead of
  widening the column.
- **Rest props go to the root**, which is what lets a tile carry `data-drawer-trigger` (the
  drawer would otherwise close and reopen when a second tile is clicked).
- `valueColor` is applied as `--stat-tile-value-color` on the tile itself, so it overrides the
  default declared on the same element.
- The background is `--stat-tile-bg` (`--color-bg-primary`); the radius is `--radius-x4`, one
  step under `Box`.
- No hooks, so it renders in server components (a clickable one needs a client parent for the
  handler).

## Storybook

`Shared/StatTile` — `Default`, `Clickable`, `WithChildren`, `ValueColor`, `CenteredWithHint`,
`Grid`, `LongLabel`, `WithoutLabel`.
