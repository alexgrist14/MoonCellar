# ResizeHandle

A small corner grip (`SvgResize`) that lets the user resize another element by dragging it with
any pointer or with the arrow keys. It writes the new size into the target's `--resize-width` and `--resize-height` custom
properties; the target's stylesheet decides what to do with them.

## When to use

- Through `Box isResizable` or a resizable `Modal` (`isResizable`), which mount it for you.
- Directly only for a new resizable panel that is neither of those.
- Not for resizing table columns — `Table` has its own column resizing.

## API

| Prop             | Type                             | Default | Purpose                                                                                   |
| ---------------- | -------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `targetRef`      | `RefObject<HTMLElement \| null>` | —       | Element whose `--resize-width`/`--resize-height` are set.                                 |
| `isCentered`     | `boolean`                        | —       | Doubles the drag speed, for a target centred on screen (modals) that grows on both sides. |
| `minWidth`       | `number`                         | `300`   | Lower bound in px (never above the starting width).                                       |
| `minHeight`      | `number`                         | `240`   | Lower bound in px (never above the starting height).                                      |
| `maxWidthRatio`  | `number`                         | `0.95`  | Upper bound as a share of `window.innerWidth`.                                            |
| `maxHeightRatio` | `number`                         | `0.92`  | Upper bound as a share of `window.innerHeight`.                                           |
| `size`           | `ISvgSizes`                      | `"16"`  | Icon size.                                                                                |
| `className`      | `string`                         | —       | Extra class on the handle.                                                                |

## Usage

```tsx
import { ResizeHandle } from "@/src/lib/shared/ui/ResizeHandle";

const panelRef = useRef<HTMLDivElement>(null);

<div ref={panelRef} className={styles.panel}>
  {children}
  <ResizeHandle targetRef={panelRef} />
</div>;
```

```scss
.panel {
  position: relative;
  width: var(--resize-width, auto);
  height: var(--resize-height, auto);
}
```

## Rules and gotchas

- The target must read the variables (`width: var(--resize-width, <fallback>)`); without that the
  drag changes nothing. `Box` and `PlaythroughModal` do this in their own modules.
- The handle is `position: absolute` in the bottom-right corner, so its offset parent must be
  positioned — normally the target itself.
- It is `display: none` below the `md` breakpoint (768px), so never make content reachable only
  by resizing.
- Dragging uses pointer events with pointer capture (mouse, pen and touch alike); only the
  primary button starts a drag.
- It is focusable: Left/Right change the width and Up/Down the height by 24px, within the same
  bounds as a drag (no `isCentered` doubling).
- The measured size includes padding and borders; before the drag it probes the target to find
  the offset between the variable and the rendered box, so the edge follows the cursor whatever
  `box-sizing` the target uses. Keep that probe if you touch the logic.
- While dragging, `user-select: none` is set on `body` and removed on pointerup or
  pointercancel.
- It is `role="separator"` with `aria-label="Resize"` and `aria-orientation="vertical"`.

## Storybook

`Shared/ResizeHandle` — `Default`, `Centered`.
