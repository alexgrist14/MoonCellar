# RangeSelector

A themed range slider with an optional label, an optional value bubble on the thumb, and a dual
mode with two thumbs for a from/to range. It keeps its own value state seeded from
`defaultValue` and reports through two callbacks: one on every move, one when the drag ends.

## When to use

- Numeric settings and numeric filters: background dim in `Settings`, the minimum list size in
  `ListsFilters`, wheel options.
- Not for picking among a few named options: use `Tabs` (`theme="segmented"`) or `Dropdown`.

## API

| Prop            | Type                           | Default              | Purpose                                                             |
| --------------- | ------------------------------ | -------------------- | ------------------------------------------------------------------- |
| `isDual`        | `boolean`                      | `false`              | Two thumbs; values become `[number, number]`                        |
| `defaultValue`  | `number` or `[number, number]` | `min` / `[min, max]` | Initial value; changes are synced in while the user is not dragging |
| `callback`      | `(value) => void`              | –                    | Fires on every change (live preview)                                |
| `finalCallback` | `(value) => void`              | –                    | Fires on mouse-up / touch-end (commit)                              |
| `min`           | `number`                       | `0`                  | Minimum                                                             |
| `max`           | `number`                       | `100`                | Maximum                                                             |
| `step`          | `number`                       | `1`                  | Step                                                                |
| `text`          | `string`                       | –                    | Label                                                               |
| `textPosition`  | `"above" \| "left" \| "right"` | above                | Label placement (left/right take 15% of the width)                  |
| `variant`       | `"accent" \| "green"`          | `"accent"`           | Fill colour                                                         |
| `isWithValue`   | `boolean`                      | –                    | Shows the value on the thumb                                        |
| `formatValue`   | `(value: number) => string`    | –                    | Formats that value (`"40%"`)                                        |
| `isLoading`     | `boolean`                      | –                    | Replaces the slider with a `Skeleton` (kept for a minimum time)     |
| `disabled`      | `boolean`                      | –                    | Disables the inputs                                                 |

In dual mode both callbacks receive `[low, high]` sorted, whichever thumb moved.

## Usage

```tsx
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";

<RangeSelector
  text="Background dim"
  defaultValue={bgOpacity}
  min={0}
  max={100}
  isWithValue
  formatValue={(value) => `${value}%`}
  callback={(value) => setBgOpacityPreview(value / 100)}
  finalCallback={(value) => setValue("bgOpacity", value, { shouldDirty: true })}
/>;
```

## Rules and gotchas

- It is uncontrolled. To reset it from outside, change its `key` (`ListsFilters` keys it on the
  query string), or rely on the `defaultValue` sync, which is skipped while a drag is in progress
  and when the new value equals what the slider itself just emitted.
- `finalCallback` fires only on mouse-up and touch-end. Keyboard changes reach `callback` only,
  so do not put the only save path behind `finalCallback` without another commit (a Save button).
- Wrap any handler that writes to a URL or the server in `finalCallback`; `callback` fires on
  every pixel of the drag.

## Storybook

`Shared/RangeSelector`: Default, WithValue, LabelLeft, Dual, Green, Loading, Disabled.
