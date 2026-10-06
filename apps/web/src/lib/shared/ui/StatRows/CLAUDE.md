# StatRows

A bordered panel of label and value rows: a muted label on the left, a bold figure with an
optional unit on the right edge, rows split by hairlines. The game page's HowLongToBeat, VNDB and
Achievements blocks.

## When to use

- A few figures that each need a readable label — the label takes the whole remaining width, so
  long captions wrap instead of being cut, and the numbers line up on the right.
- Not for one big counter or a grid of clickable counters — that is `StatTile`; not for a labelled
  block of arbitrary content — wrap `StatRows` in `InfoBlock` for the caption.

## API

| Prop        | Type         | Default | Purpose                                   |
| ----------- | ------------ | ------- | ----------------------------------------- |
| `rows`      | `IStatRow[]` | —       | The rows, in order; empty renders nothing |
| `className` | `string`     | —       | Extra class on the root `dl`              |

`IStatRow`:

| Field   | Type        | Purpose                                                                 |
| ------- | ----------- | ----------------------------------------------------------------------- |
| `key`   | `string`    | React key; defaults to the label when it is a string                    |
| `label` | `ReactNode` | Caption, 14/18px `--color-text-muted`                                   |
| `value` | `ReactNode` | The figure, 16/20px bold, tabular numbers, never wraps; format it first |
| `unit`  | `ReactNode` | Small muted suffix after the value ("h")                                |
| `icon`  | `ReactNode` | Rendered before the label (a trophy)                                    |
| `title` | `string`    | Native tooltip on the row                                               |

## Usage

```tsx
import { StatRows } from "@/src/lib/shared/ui/StatRows";

<InfoBlock title="HowLongToBeat:">
  <StatRows rows={[{ label: "Main story", value: "24", unit: "h" }]} />
</InfoBlock>;
```

## Rules and gotchas

- **Rendered as `dl`/`dt`/`dd`**, so each row is a term and its value for screen readers.
- Icons sit in a fixed 20px slot (`--padding-x5`), so labels line up even when the icons differ
  in size.
- The value never wraps (`white-space: nowrap`); the label shrinks and wraps instead.
- Background `--stat-tile-bg` and radius `--radius-x4`, the same as `StatTile`, so both sit
  together in one side column. Rows are at least `--field-control-height` tall.
- No hooks; renders in server components.

## Storybook

`Shared/StatRows` — `Default`, `SingleRow`, `WithIcons`, `LongValues`, `LongLabel`, `Empty`.
