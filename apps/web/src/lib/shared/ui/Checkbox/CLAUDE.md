# Checkbox

A round, styled native `<input type="checkbox">`. Besides the default accent fill it has
`on`/`off` themes used by include/exclude filters in `Dropdown`.

## When to use

- Any boolean toggle in a form or list (spoiler flag in the comment composer, row selection,
  dropdown options).
- Not for a row of mutually exclusive choices — that is `Tabs`.

## API

| Prop                                                                      | Type                                   | Default    | Purpose                                                              |
| ------------------------------------------------------------------------- | -------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `checked`                                                                 | `boolean`                              | —          | Checked state (optional; the fill follows the DOM `:checked` state). |
| `onChange`                                                                | `ChangeEventHandler<HTMLInputElement>` | —          | Change handler.                                                      |
| `onClick`                                                                 | `MouseEventHandler<HTMLInputElement>`  | —          | Click handler.                                                       |
| `colorTheme`                                                              | `"accent" \| "on" \| "off"`            | `"accent"` | Fill colour when checked.                                            |
| `isBorderFromTheme`                                                       | `boolean`                              | —          | Colours the border by `colorTheme`.                                  |
| `borderColor`                                                             | `string`                               | —          | Inline border colour override.                                       |
| `id`, `required`, `disabled`, `className`, `aria-label`, `defaultChecked` | native                                 | —          | Passed to the input.                                                 |

## Usage

```tsx
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";

<label htmlFor={spoilerId}>
  <Checkbox
    id={spoilerId}
    checked={isSpoiler}
    onChange={(event) => setIsSpoiler(event.target.checked)}
  />
  Contains spoilers
</label>;
```

## Rules and gotchas

- The fill is styled from `:checked`, so controlled and uncontrolled checkboxes both change
  colour. A checked `on`/`off` checkbox resets its border to the text colour, even with
  `isBorderFromTheme`.
- **Give it a name.** Wrap it in a `<label>` or pass `aria-label`; the input has no text of its
  own.
- Keyboard focus draws a `:focus-visible` accent outline outside the circle.

## Storybook

`Shared/Checkbox`: `Default`, `Checked`, `Included`, `Excluded`, `BorderFromTheme`,
`AccentBorder`, `Disabled`, `Interactive`, `Uncontrolled`.
