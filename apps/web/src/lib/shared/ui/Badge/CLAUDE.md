# Badge

Small non-interactive pill that labels a status or a short attribute: "Pending", "Hidden",
"Spoiler", "Winner", a game type.

## When to use

- A short status or tag next to a title, inside a card header or in a table cell.
- Not for something the user clicks or removes — that is `Chip`.
- Not for a number on a tab — that is `TabsMenu`'s count; not for a counter tile — that is
  `StatTile`.
- Keep the text to one or two words; it does not wrap unless `isWrap` is set.

## API

| Prop        | Type                                                                          | Default     | Purpose                                                                       |
| ----------- | ----------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `children`  | `ReactNode`                                                                   | —           | Label                                                                         |
| `tone`      | `"neutral" \| "muted" \| "attention" \| "positive" \| "negative" \| "accent"` | `"neutral"` | Colour of the text and background                                             |
| `size`      | `"sm" \| "md"`                                                                | `"sm"`      | `sm` 12/18px, inline padding only; `md` 13/17px with block padding            |
| `isWithDot` | `boolean`                                                                     | `false`     | Small dot in the text colour before the label                                 |
| `variant`   | `"soft" \| "outlined"`                                                        | `"soft"`    | `outlined`: transparent background with a `--color-border-primary` inset ring |
| `isWrap`    | `boolean`                                                                     | `false`     | Allows the label to wrap and the badge to shrink (long game names)            |
| `ref`       | `Ref<HTMLSpanElement>`                                                        | —           | Forwarded to the `span`, so a `Badge` can be a `Tooltip` trigger              |
| `className` | `string`                                                                      | —           | Extra class                                                                   |
| `...rest`   | `HTMLAttributes<HTMLSpanElement>`                                             | —           | `title`, `aria-*`, `data-*` reach the `span`                                  |

Tones: `neutral` — secondary text on `--color-bg-tertiary`; `muted` — muted text on the same
background; `attention`, `positive`, `negative`, `accent` — the colour's text on a
`--badge-tint-strength` tint of it (`negative` text uses `--badge-negative-color`, because
`--color-negative` text on its own tint does not read on the dark theme).

## Usage

```tsx
import { Badge } from "@/src/lib/shared/ui/Badge";

<Badge tone="attention" isWithDot>Pending</Badge>
<Badge tone="muted">{game.type}</Badge>
<Badge tone="positive" size="md">Winner</Badge>
```

## Rules and gotchas

- **`sm` has no block padding on purpose:** it sits on a text line (comment header, card meta)
  and must not raise the line height. Use `md` for a standalone status (a request row, a
  list of picks).
- **Use `variant="outlined"` on a `--color-bg-tertiary` surface** (the conflict candidate
  cards): `neutral` and `muted` paint that same colour, so a soft badge there loses its pill.
  The ring is an inset `box-shadow`, so it does not change the badge's size.
- **A `Badge` can be the direct child of `Tooltip`** — it forwards `ref`. Add `tabIndex={0}` so
  keyboard users reach the hint; no wrapping `span` is needed.
- Tones are generic. Map a domain status to a tone in the entity that owns it
  (`RequestStatus` maps `approved` → `positive`); do not add domain-named tones here.
- **Do not re-colour it from a consumer's module.** A `className` that sets `--badge-color` or
  `--badge-bg` has the same specificity as the tone class, and the order two CSS modules land in
  is not guaranteed — pick a tone, or add one here.
- No hooks, so it renders in server components.

## Storybook

`Shared/Badge` — `Default`, `Medium`, `WithDot`, `AllTones`, `AllTonesWithDot`, `InText`,
`Outlined`, `Wrapping`, `WithTooltip`.
