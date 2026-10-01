# ChoiceCards

A radio group drawn as rich cards: an icon tile, a title, a line of text, an optional meta
line, and a radio dot. Exactly one card is checked.

## When to use

- Picking one of a few modes where each option needs an explanation (the gauntlet's
  Gauntlet/Royal mode).
- Two to five options. A compact exclusive switch is `Tabs` (`theme="segmented"`); a long list
  is `Dropdown`; picking an image from thumbnails is `ImagePickerField` (`shared/ui/Fields`).

## API

`ChoiceCards<T>`:

| Prop         | Type                     | Default | Purpose                                                          |
| ------------ | ------------------------ | ------- | ---------------------------------------------------------------- |
| `options`    | `IChoiceCardOption<T>[]` | —       | Cards, in order.                                                 |
| `value`      | `T`                      | —       | Checked option, compared with `===`.                             |
| `onChange`   | `(value: T) => void`     | —       | Called with the newly checked value (never for the checked one). |
| `ariaLabel`  | `string`                 | —       | Accessible name of the `radiogroup`. Required.                   |
| `isDisabled` | `boolean`                | —       | Disables every card.                                             |
| `className`  | `string`                 | —       | Class on the group (a one-column grid with `--gap-x2`).          |

`IChoiceCardOption<T>`:

| Field        | Type                      | Purpose                                                          |
| ------------ | ------------------------- | ---------------------------------------------------------------- |
| `value`      | `T`                       | Value reported by `onChange`; `String(value)` is the React key.  |
| `title`      | `ReactNode`               | Card title (16px bold).                                          |
| `text`       | `ReactNode`               | Muted description.                                               |
| `icon`       | `ReactNode`               | `Svg*` in a tinted tile; without it the card has no icon column. |
| `meta`       | `ReactNode`               | Small line under the text; `<b>` inside takes the tone colour.   |
| `tone`       | `"accent" \| "attention"` | Colour of the border, glow, icon tile and dot. Default `accent`. |
| `isDisabled` | `boolean`                 | Disables this card and skips it in keyboard navigation.          |

## Usage

```tsx
import { ChoiceCards } from "@/src/lib/shared/ui/ChoiceCards";

<ChoiceCards
  ariaLabel="Gauntlet mode"
  value={isRoyal}
  onChange={setRoyal}
  options={[
    {
      value: false,
      title: "Gauntlet",
      text: "One spin over the whole catalogue",
      icon: <SvgRandom />,
      meta: gauntletCount,
    },
    {
      value: true,
      title: "Royal",
      text: "Knock-out over your crowned games",
      icon: <SvgCrown />,
      meta: royalCount,
      tone: "attention",
    },
  ]}
/>;
```

## Rules and gotchas

- Keyboard follows the native radio pattern: one tab stop (the checked card, or the first
  enabled one), Arrow keys move and select with wrap-around, Home/End jump to the ends.
  Disabled cards are skipped.
- When any option has `meta`, every card renders the meta line, using a non-breaking space
  where it is empty, so the cards keep the same height while counts load.
- Values must be unique by `String(value)`; they are the React keys.
- The tone is a custom property (`--choice-card-tone`) declared on the card itself by its tone
  class, so it resolves per card.
- Each card is a `type="button"`, safe inside a `<form>`, but it is not a form field — wire it
  through `Controller` or `setValue`.

## Storybook

`Shared/ChoiceCards`: `Default`, `SecondSelected`, `WithoutMeta`, `MissingMeta`,
`WithoutIcons`, `DisabledOption`, `Disabled`.
