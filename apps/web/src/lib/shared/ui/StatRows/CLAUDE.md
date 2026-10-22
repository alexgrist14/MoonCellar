# StatRows

A bordered panel of label and value rows: a muted label on the left, a bold figure with an
optional unit on the right edge, rows split by hairlines. The game page's HowLongToBeat, VNDB and
Achievements blocks.

## When to use

- A few figures that each need a readable label — the label takes the whole remaining width, so
  long captions wrap instead of being cut, and the numbers line up on the right.
- A row that opens something (a popover anchored to it, a modal) takes `onClick`; the game page's
  port row opens the port's achievements modal.
- A row that leads to a page takes `href` (with `isExternal` for another site); the game page's
  Steam and RetroAchievements rows open those sites' achievement pages.
- Not for one big counter or a grid of clickable counters — that is `StatTile`; not for a labelled
  block of arbitrary content — wrap `StatRows` in `InfoBlock` for the caption.

## API

| Prop        | Type         | Default | Purpose                                   |
| ----------- | ------------ | ------- | ----------------------------------------- |
| `rows`      | `IStatRow[]` | —       | The rows, in order; empty renders nothing |
| `className` | `string`     | —       | Extra class on the root `dl`              |

`IStatRow`:

| Field        | Type                                          | Purpose                                                                                                           |
| ------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `key`        | `string`                                      | React key; defaults to the label when it is a string                                                              |
| `label`      | `ReactNode`                                   | Caption, 14/18px `--color-text-muted`                                                                             |
| `sublabel`   | `ReactNode`                                   | Second line under the label, 12/16px muted (a platform name)                                                      |
| `value`      | `ReactNode`                                   | The figure, 16/20px bold, tabular numbers, never wraps; format it first                                           |
| `unit`       | `ReactNode`                                   | Small muted suffix after the value ("h")                                                                          |
| `icon`       | `ReactNode`                                   | Rendered before the label (a trophy)                                                                              |
| `title`      | `string`                                      | Native tooltip on the row                                                                                         |
| `href`       | `string`                                      | Makes the whole row a link (Next `Link`); hover and focus ring as with `onClick`; wins over `onClick`             |
| `isExternal` | `boolean`                                     | With `href`, renders `<a target="_blank" rel="noreferrer">` instead of `Link`                                     |
| `onClick`    | `(event: MouseEvent<HTMLDivElement>) => void` | Makes the row a button: hover, focus ring, Enter and Space; `event.currentTarget` is the row, to anchor a popover |

## Usage

```tsx
import { StatRows } from "@/src/lib/shared/ui/StatRows";

<InfoBlock title="HowLongToBeat:">
  <StatRows rows={[{ label: "Main story", value: "24", unit: "h" }]} />
</InfoBlock>;
```

## Rules and gotchas

- **Rendered as `dl`/`dt`/`dd`**, so each row is a term and its value for screen readers.
- **A clickable row is the row `div` itself with `role="button"`, never a `<button>`.** A `dl`
  may hold only `div`s wrapping `dt`/`dd`, and a button may not contain them. Enter and Space
  call `click()` on the row, so `onClick` always receives a mouse event and its `currentTarget`.
- **A linked row puts the link on the label and stretches it over the row.** An `<a>` cannot
  wrap the row for the same `dl` reason, so the label inside `dt` is the link and its `::after`
  covers the row (`position: relative`); the whole row is clickable, and the focus ring shows on
  the row through `:has(:focus-visible)`. Linked rows render in server components, so the links
  stay in the HTML.
- The root clips its rows (`overflow: hidden`) so a hovered first or last row keeps the rounded
  corners; the focus ring is an inset outline for the same reason.
- Icons sit in a fixed 20px slot (`--padding-x5`), so labels line up even when the icons differ
  in size.
- The value never wraps (`white-space: nowrap`); the label shrinks and wraps instead.
- Background `--stat-tile-bg` and radius `--radius-x4`, the same as `StatTile`, so both sit
  together in one side column. Rows are at least `--field-control-height` tall.
- No hooks; renders in server components, except with `onClick`, which only a client component
  can pass.

## Storybook

`Shared/StatRows` — `Default`, `SingleRow`, `WithIcons`, `Clickable`, `Linked`, `LongValues`, `LongLabel`,
`Empty`.
