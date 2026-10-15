# ProgressBar

A thin horizontal bar that shows how far something has got: achievements unlocked, a background
job's progress. A styled native `<progress>`, so screen readers announce the value.

## When to use

- A known fraction (`value` of `max`), or work whose size is not known yet (no `value`: an
  indeterminate sweep).
- Not for a value the user sets — that is `RangeSelector`; not for a page or block that is
  loading — that is `Loader` or `Skeleton`.

## API

| Prop        | Type                                                 | Default     | Purpose                                                                |
| ----------- | ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `value`     | `number`                                             | —           | Progress so far; omitted, the bar is indeterminate and sweeps          |
| `max`       | `number`                                             | `1`         | The value of a full bar; pass at least 1 (a `max` of 0 is invalid)     |
| `tone`      | `"neutral" \| "accent" \| "attention" \| "negative"` | `"neutral"` | Colour of the filled part (`--color-text-secondary` for `neutral`)     |
| `className` | `string`                                             | —           | Extra class, for placement only                                        |
| `...rest`   | `ProgressHTMLAttributes<HTMLProgressElement>`        | —           | `aria-label` (always pass one), `title`, `data-*` reach the `progress` |

## Usage

```tsx
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";

<ProgressBar
  value={unlocked}
  max={total}
  tone={isMastered ? "attention" : "neutral"}
  aria-label={`${unlocked} of ${total} achievements unlocked`}
/>

<ProgressBar value={status.total ? status.done : undefined} max={status.total || 1} />
```

## Rules and gotchas

- **The track is `--color-bg-primary`, so the bar is made for a `Box` or a popover panel**
  (`--color-bg-secondary`); on a primary-coloured surface the empty part disappears.
- **Always pass `aria-label`** saying what is measured, with the numbers ("34 of 51 achievements
  unlocked"); the bar has no visible text of its own.
- `width: 100%` sits in `:where(.bar)`, so a consumer's class can size it in any CSS order.
- The indeterminate sweep stops under `prefers-reduced-motion`, leaving a static stripe.
- Height is `--progress-bar-height`; the sweep is `--progress-bar-sweep-duration`.
- No hooks, so it renders in server components.

## Storybook

`Shared/ProgressBar` — `Default`, `Empty`, `Full`, `Indeterminate`, `AllTones`.
