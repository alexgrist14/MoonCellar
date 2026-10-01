# Tooltip

A hover/focus tooltip for a single child element. It attaches listeners to the child through a
merged ref, portals a fixed-position bubble into `#tooltip-connector` (falling back to
`document.body`), and flips to the opposite side when the preferred one runs out of viewport.

## When to use

- Short hints on icon buttons, avatars, rating stars. For buttons, prefer `Button`'s `tooltip`
  prop, which wraps this and also sets the `aria-label`.
- Not for content the user must read or interact with: it never shows on touch, and the bubble
  is not hoverable. Use a `Popover` instead.

## API

| Prop         | Type                                     | Default    | Purpose                                                      |
| ------------ | ---------------------------------------- | ---------- | ------------------------------------------------------------ |
| `children`   | `ReactElement`                           | required   | Trigger; must accept a `ref` and forward it to a DOM element |
| `content`    | `ReactNode`                              | required   | Bubble content                                               |
| `position`   | `"top" \| "bottom" \| "left" \| "right"` | `"top"`    | Preferred side (flipped if it does not fit)                  |
| `align`      | `"start" \| "center" \| "end"`           | `"center"` | Alignment along that side                                    |
| `className`  | `string`                                 | –          | Class on the bubble                                          |
| `isDisabled` | `boolean`                                | –          | Never shows the bubble                                       |
| `root`       | `HTMLElement \| null`                    | –          | Portal target overriding `#tooltip-connector`                |

## Usage

```tsx
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";

<Tooltip className={styles.tooltip} content={user.userName}>
  <span className={styles.avatar}>{avatar}</span>
</Tooltip>;
```

## Rules and gotchas

- The child must be a single element that forwards `ref` to the DOM (a native element, or a
  React 19 component taking `ref` as a prop). A component that drops the ref gets no tooltip
  and no error.
- It shows only for `pointerType === "mouse"` and for `:focus-visible` focus; it hides on
  pointerdown. Do not put information there that touch users need.
- The tooltip text is not linked to the trigger with `aria-describedby`; give an icon-only
  trigger its own `aria-label`.
- `#tooltip-connector` lives in `Layout`, and `DrawerConnector` treats it as part of the drawer
  for outside clicks. A custom `root` loses that.

## Storybook

`Shared/Tooltip`: Default, Positions, LongContent, Disabled.
