# svg

The site's icon set: one `Svg*` component per icon, all built on the base `Svg` and `Path`
components in `Svg/Svg.tsx` and exported from `index.ts`. `Svg` sets the size, viewBox, colour
token and a shared transition; `Path` draws a filled or stroked path in `currentColor`.

## When to use

- Every icon in the app. Never use `@iconify/react`'s `Icon` or any other icon library component.
- When the icon is missing, add a new `Svg*` component here (see below) — do not inline a raw
  `<svg>` in a feature.
- Not for raster artwork or logos with photos — use `next/image` with a file from `public/`.

## API

`Svg` (also the props every icon accepts as `ISvgBaseProps`):

| Prop        | Type                        | Default         | Purpose                                                                      |
| ----------- | --------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `size`      | `ISvgSizes` (`"12"`…`"40"`) | `"20"`          | Width, height, min-width and min-height.                                     |
| `color`     | `ISvgColors`                | `"contrast"`    | Sets CSS `color` to `var(--color-<color>)`; paths paint with `currentColor`. |
| `className` | `string`                    | —               | Extra class on the `<svg>`.                                                  |
| `style`     | `CSSProperties`             | —               | Inline style, merged last (can override `color`).                            |
| `id`        | `string`                    | —               | `id` on the `<svg>`.                                                         |
| `ref`       | `Ref<SVGSVGElement>`        | —               | Ref to the `<svg>`.                                                          |
| `viewBox`   | `string`                    | `0 0 size size` | Base only: the icon's own coordinate box.                                    |
| `transform` | `string`                    | —               | Base only: CSS transform on the `<svg>`.                                     |

`ISvgColors`: `primary`, `secondary`, `accent`, `positive`, `negative`, `contrast`,
`contrast-reverse`, `attention`.

`Path`: `d`, `type` (`"fill"` default or `"stroke"`), `color` (defaults to `currentColor`),
`strokeWidth`, `strokeLinecap`, `strokeLinejoin`, `strokeDasharray`, `clipPath`, `opacity`,
`className`, `defaultFillRule`, `defaultClipRule`.

A few icons take extra props: `SvgStar`/`SvgMoon` `fillPercent`, `SvgNumber` `value` (0–10,
required), `SvgBurger` `isOpen` (animates the three lines into a cross; omitted or `false` is
the plain burger) plus the legacy `topId`/`middleId`/`bottomId` extra classes per line. Some older icons are typed `FCCLSC`
(`className`, `style`, `color`, `size` only).

## Usage

```tsx
import { SvgClose, SvgStar } from "@/src/lib/shared/ui/svg";

<SvgClose size="16" />
<SvgStar size="24" color="attention" fillPercent={50} />
```

Adding an icon (`SvgTicket.tsx`), then `export * from "./SvgTicket";` in `index.ts`:

```tsx
import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgTicket: FC<ISvgBaseProps> = (props) => (
  <Svg {...props} viewBox="0 0 24 24">
    <Path d="M7 4h10v3a5 5 0 0 1-10 0z" />
  </Svg>
);
```

## Rules and gotchas

- Build icons only from `Svg` and `Path`, never raw `<svg>`/`<path>`, so size, colour token and
  transition stay uniform. The barrel does not export them: icons import `./Svg/Svg`, and
  nothing outside this folder should draw with the base components directly.
- Always pass the source's `viewBox`; the default `0 0 size size` only fits paths drawn on a
  20×20 (or `size`) grid and otherwise crops or shrinks the glyph.
- `Path` applies `fill-rule`/`clip-rule: evenodd` unless `defaultFillRule`/`defaultClipRule` is
  set. Font Awesome-style paths with overlapping subpaths need both flags, or holes appear.
- Colour comes from the `color` token or from the parent through `currentColor` (`color` in a
  module, e.g. `& svg { color: … }`); never hard-code a hex in `Path`'s `color`.
- Gradient or multi-colour icons (`SvgLogo`) define `<defs>` ids; two on one page share those ids,
  so keep them unique per icon.
- Export every new icon from `index.ts`; an icon missing there is absent from the `Icons` story.
- `SvgBurger`'s open animation lives in `SvgBurger.module.scss` with its own keyframes; pass
  `isOpen` instead of re-creating it with `topId`/`middleId`/`bottomId` classes in a consumer.
  Only the opening is animated — switching back to closed snaps to the burger. The `up-rotate`,
  `down-rotate` and `hide` keyframes in `_animations.scss` exist only for the consumers not yet
  migrated to `isOpen`; delete them with the last one.
- Icon-only buttons need an accessible name (`aria-label` on the `Button`); the `<svg>` has no
  title.

## Storybook

`Shared/Icons` — `All`: every `Svg*` export of `index.ts` in a labelled grid; `BurgerClosed`,
`BurgerOpen` and `BurgerAnimated` (click to toggle) for `SvgBurger`'s `isOpen`.
