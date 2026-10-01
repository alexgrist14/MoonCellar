# ToggleSwitch

A two-position pill switch with a sliding knob and a text (or node) on each side, plus an
optional label (with an optional hint line under it) beside the switch. Left is "off", right is
"on".

## When to use

- A boolean setting that takes effect or is saved as a value: "Show adult content", "Mastered?",
  "Contains spoilers", wheel options.
- A checkbox in a list or table is `Checkbox`. Three or more exclusive options are `Tabs`
  (`theme="segmented"`).

## API

| Prop            | Type                          | Default   | Purpose                                                                    |
| --------------- | ----------------------------- | --------- | -------------------------------------------------------------------------- |
| `checked`       | `boolean`                     | —         | Controlled state, the boolean form of `value`; wins over `value`.          |
| `onChange`      | `(value: boolean) => void`    | —         | Called (debounced 200ms) with the new state: `true` when it moves right.   |
| `clickCallback` | `(result: ReactNode) => void` | —         | Called (debounced 200ms) with the content of the side the switch moves to. |
| `value`         | `"left" \| "right"`           | —         | Controlled position. When set, the internal state is ignored.              |
| `defaultValue`  | `"left" \| "right"`           | `"left"`  | Initial position when uncontrolled.                                        |
| `leftContent`   | `ReactNode`                   | `"OFF"`   | Text of the left (off) side.                                               |
| `rightContent`  | `ReactNode`                   | `"ON"`    | Text of the right (on) side.                                               |
| `label`         | `string`                      | —         | Caption beside the switch; also its accessible name (`aria-labelledby`).   |
| `hint`          | `ReactNode`                   | —         | Muted line under the label; the switch's `aria-describedby`.               |
| `labelPosition` | `"start" \| "end"`            | `"start"` | Label and hint before the switch, or after it (the filters panel look).    |
| `isDisabled`    | `boolean`                     | —         | Dims the switch, blocks clicks and keys, removes it from the tab order.    |
| `isColorless`   | `boolean`                     | —         | Neutral outline instead of the on/off colours.                             |
| `scale`         | `string`                      | `"0.8"`   | CSS `scale` of the switch.                                                 |
| `className`     | `string`                      | —         | Extra class on the switch.                                                 |

## Usage

```tsx
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";

<ToggleSwitch
  label="Contains spoilers"
  hint="Hides the text until a reader opens it."
  leftContent="No"
  rightContent="Yes"
  checked={field.value}
  onChange={field.onChange}
/>;
```

## Rules and gotchas

- **Prefer `checked` plus `onChange(value: boolean)`.** `clickCallback`'s `result` is the side's
  display content, so comparing it (`result === "ON"`) breaks as soon as the labels change; it
  stays only for callers that really want the side's content. Both callbacks fire when both are
  passed.
- A hint goes in `hint`, not in a sibling `<span>`: the prop ties it to the switch through
  `aria-describedby` and top-aligns the switch with the label when the hint wraps.
- The callback is debounced by 200ms and the switch ignores clicks and keys for 600ms after
  each toggle; do not chain anything that expects a synchronous update.
- In controlled mode the knob moves only when the parent updates `checked`/`value`; a callback that
  does not update it leaves the switch where it was.
- It is a focusable `div` with `role="switch"` and `aria-checked` (true on the right side);
  Space and Enter toggle it like a click, and keyboard focus draws an accent ring with
  `box-shadow`, because `outline` already carries the on/off colour. Without `label` its
  accessible name is the text of both sides, so give it a `label` wherever there is no other
  visible caption.
- Inside a native `<form>` it does not submit (no button involved), but it is not a form
  field either — wire it through `Controller` or `setValue`.

## Storybook

`Shared/ToggleSwitch`: `Default`, `Controlled`, `CustomLabels`, `WithLabel`, `WithHint`,
`LabelAtEnd`, `Colorless`, `Disabled`.
