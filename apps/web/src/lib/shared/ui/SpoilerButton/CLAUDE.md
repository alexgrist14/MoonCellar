# SpoilerButton

The attention-toned pill with an eye icon that reveals or hides spoiler content. A native
`<button type="button">` with every native button attribute passed through except `type`.

## When to use

- Any control that shows or hides spoilers: the reveal and hide buttons inside `Spoiler`, or a
  toggle that filters spoiler items out of a list (spoiler characters of a game).
- Not for other actions — that is `Button`. The pill look is reserved for spoilers so the reader
  recognises it.

## API

Every `<button>` attribute except `type` (`onClick`, `disabled`, `aria-pressed`, `aria-label`, …),
plus:

| Prop        | Type        | Default | Purpose                                               |
| ----------- | ----------- | ------- | ----------------------------------------------------- |
| `children`  | `ReactNode` | —       | Label after the eye icon ("Show spoilers")            |
| `className` | `string`    | —       | Extra class on the button, for positioning and layout |

## Usage

```tsx
import { SpoilerButton } from "@/src/lib/shared/ui/SpoilerButton";

<SpoilerButton
  aria-pressed={showSpoilers}
  onClick={() => setShowSpoilers(!showSpoilers)}
>
  {showSpoilers ? "Hide spoilers" : "Show spoilers"}
</SpoilerButton>;
```

## Rules and gotchas

- **It is not `Button` on purpose.** It is a `--radius-x4` pill with an attention outline, and
  `Button` keeps every button at `--radius-button` with no `ButtonColor` for that outline.
- A consumer's `className` is for position and layout only (`Spoiler` centres it absolutely over
  the blurred content). Colour, border, padding and font come from the component.
- A toggle passes `aria-pressed`, so screen readers announce its state, not only the label.

## Storybook

`Shared/SpoilerButton` — `Default`, `LongLabel`, `Toggle`.
