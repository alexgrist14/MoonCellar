# Box

The site's panel: a semi-transparent rounded container with an optional heading, header action,
close button, custom scroll area, blur and resize handle. Every content block on a page sits in a
`Box`, because only its panel keeps text legible over the full-bleed `BGImage` behind pages.

## When to use

- Every content block on a page, however small: breadcrumbs, headings, intro paragraphs, link
  rows. If a block feels too small for a panel, group it with its neighbour in one `Box`.
- Modal and drawer bodies (`DrawerConnector`, `SaveForm`) use it too.
- Not for decorative tiles (covers, cards): those have their own components.

## API

| Prop                    | Type                          | Default  | Purpose                                                                       |
| ----------------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------- |
| `children`              | `ReactNode`                   | required | Panel content                                                                 |
| `title`                 | `ReactNode`                   | –        | Heading (`h2`); no title means no header at all                               |
| `titleCount`            | `number`                      | –        | Muted `(n)` after the title, like `SectionTitle`'s `count` (`0` is shown)     |
| `titleAction`           | `ReactNode`                   | –        | Element rendered next to the title                                            |
| `onClose`               | `() => void`                  | –        | Adds a transparent close button with a "Close" tooltip to the header          |
| `closeButtonRef`        | `Ref<HTMLButtonElement>`      | –        | Ref to that close button (focus management in modals)                         |
| `isHeaderWithoutStyles` | `boolean`                     | –        | Renders the title outside the panel, above it                                 |
| `isVerticalActions`     | `boolean`                     | –        | Stacks the title and its action vertically                                    |
| `isTitleStart`          | `boolean`                     | –        | Aligns the title to the start                                                 |
| `className`             | `string`                      | –        | Class on the outer wrapper                                                    |
| `classNameContent`      | `string`                      | –        | Class on the content element (or the scroll content)                          |
| `wrapperStyle`          | `CSSProperties`               | –        | Inline style on the outer wrapper                                             |
| `templateStyle`         | `CSSProperties`               | –        | Inline style on the panel (`.template`)                                       |
| `contentStyle`          | `CSSProperties`               | –        | Inline style on the content element                                           |
| `isWithScrollBar`       | `boolean`                     | –        | Wraps content in the shared `Scrollbar` (capped at 90dvh)                     |
| `scrollFadeType`        | `"both" \| "top" \| "bottom"` | –        | Passed to `Scrollbar.fadeType`; has no visible effect on this vertical scroll |
| `isWithBlur`            | `boolean`                     | –        | Backdrop blur on the panel                                                    |
| `isWithoutBorder`       | `boolean`                     | –        | Removes the panel border                                                      |
| `isResizable`           | `boolean`                     | –        | Adds a `ResizeHandle` to the wrapper                                          |

## Usage

```tsx
import { Box } from "@/src/lib/shared/ui/Box";

<Box title="How long to beat">
  <GameHltbBlock game={game} />
</Box>

<Box
  title="Characters"
  isWithScrollBar
  wrapperStyle={{ minHeight: 0, maxHeight: "100%" }}
  templateStyle={{ height: "100%", minHeight: 0 }}
  onClose={close}
>
  {characters}
</Box>
```

## Rules and gotchas

- A count next to the heading goes in `titleCount`, not into the `title` string or a
  `SectionTitle` inside the content: the string reads as part of the name, and an inner
  heading duplicates the header the panel already draws.
- Change a `Box`'s look only through its own props, never by overriding its internal classes
  from outside or copying its markup into a custom wrapper.
- A percentage `max-height` on `contentStyle` does nothing on its own: `.wrapper` and
  `.template` are `height: fit-content`. Give the grid cell `align-self: stretch; min-height: 0`
  and pass `minHeight: 0; maxHeight: 100%` through `wrapperStyle`/`templateStyle`.
- A `Box` stretched to a fixed-height container (`templateStyle={{ height: "100%" }}`) also needs
  `minHeight: 0` in `templateStyle`, or the grid row sizes to content and the panel's bottom ends
  up below the screen.
- For a row of equal-height panels pass `wrapperStyle={{ height: "auto" }}` and
  `templateStyle={{ height: "100%" }}`; `height: 100%` on the wrapper cancels the flex stretch.
- Do not remove the `min-height: 0` on `.template__resizer` and on the `Scrollbar` container:
  without them `max-height` clamps only the background while the text flows past the border.
- The same goes for `min-height: 0` on `.template__content`: a `Box` filling a fixed-height
  container without `isWithScrollBar` (the search modal) hands the scroll to a child with
  `flex: 1` and `min-height: 0`; without it the content grows to the full result list, no
  scrollbar appears and the cards run past the panel's bottom border.
- A child of a scrolling `Box` with its own `min-height` (or fixed `height`) needs
  `flex-shrink: 0`, or it shrinks to the cap and its last row sits on the bottom padding.
- Do not put a new element between a grid cell and the `Box` to animate it; animate the cell,
  and only `opacity`/`transform` (height animation fires the resize detector every frame).
- Children's structural radius is one step below the panel's `--radius-x5` (`x4`, then `x3`).
- No `"use client"`: import it from a client component, never directly into a route under
  `src/app/` (it fails with `useRef is not a function`).

## Storybook

`Shared/Box`: Default, WithTitle, WithTitleCount, WithNodeTitle, WithClose, WithTitleAction,
HeaderOutside, Scrollable, FillsContainer, Borderless.
