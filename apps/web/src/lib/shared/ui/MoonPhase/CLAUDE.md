# MoonPhase

A small disc showing the moon as it looks at a given point of its cycle: the lit part in
`--moon-phase-lit-color`, the shadow in `--moon-phase-dark-color`, waxing lit on the right.
With no phase it draws a dashed empty circle, for a date that is not known yet. The home page's
release calendar marks each release date with the moon of that night.

## When to use

- A date marker where the moon of that date is part of the information (the release calendar's
  nodes, "Tonight").
- Not as the MoonCellar logo or in its place: the mark is `logo-icon.png` (see
  `docs/branding.md`). This glyph is neutral on purpose and is never drawn in the accent violet,
  so it cannot be read as a redrawn mark.
- Not as a decorative bullet with no date behind it.

## API

| Prop            | Type        | Default | Purpose                                                                                  |
| --------------- | ----------- | ------- | ---------------------------------------------------------------------------------------- |
| `phase`         | `number`    | –       | Point of the cycle, `0`–`1`: `0` new, `0.25` first quarter, `0.5` full. Omitted: unknown |
| `size`          | `ISvgSizes` | `"20"`  | Rendered size in px (`"12"` … `"40"`)                                                    |
| `label`         | `string`    | –       | Accessible name (`role="img"`); without it the glyph is `aria-hidden`                    |
| `isHighlighted` | `boolean`   | –       | Accent ring around the disc, for the one date the reader is at ("Tonight")               |
| `className`     | `string`    | –       | Class on the wrapping `span`, for placement only                                         |

## Usage

```tsx
import { MoonPhase } from "@/src/lib/shared/ui/MoonPhase";
import { getMoonPhase, getMoonPhaseName } from "@/src/lib/shared/utils/moon.utils";

const phase = getMoonPhase(releaseDateMs);

<MoonPhase phase={phase} />
<MoonPhase phase={phase} size="28" isHighlighted label={getMoonPhaseName(phase)} />
<MoonPhase />
```

## Rules and gotchas

- **Compute the phase from a timestamp the server passed down, never from `Date.now()` during
  render.** The phase changes through the day, so a client render a few hours after the server
  one draws a different path and fails hydration.
- **`getMoonLitPath` rounds the terminator radius to three decimals; keep it rounded.**
  `Math.cos` in Node and in the browser can differ in the last digit, so an unrounded path
  (`A7.565398438466481` on the server, `…479` in Chrome) fails hydration on every page that
  draws a moon.
- The phase comes from `getMoonPhase` in `shared/utils/moon.utils.ts`, which uses the mean
  synodic month: it can be off by up to about half a day, which is invisible at glyph size. If
  exact phase times are ever shown as text, replace it with a real ephemeris.
- The glyph is opaque, so a line drawn behind it (the calendar's axis) stops at its edge; the
  unknown state is filled with `--moon-phase-unknown-fill` (the `Box` colour) for the same reason.
- `label` is for a glyph that stands alone. Next to text that already names the phase or the
  date, leave it out so a screen reader does not read the moon for every date.

## Storybook

`Shared/MoonPhase`: Default, AllPhases, Unknown, Highlighted, WithLabel, Sizes.
