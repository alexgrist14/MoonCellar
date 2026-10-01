# Background

A decorative, absolutely positioned panel showing `/images/auth-background.webp` that drifts
slowly left and back on a 60-second loop. It takes no props and renders a single empty `div`.

## When to use

- As decorative artwork behind a self-contained panel that provides its own `position: relative`
  container.
- Not for a page background — pages use `BGImage`, which picks the artwork per game or user and
  is what `Box` panels are designed to sit on.
- Currently no file in `apps/web/src` imports it; check whether it is still needed before
  building on it.

## API

No props.

## Usage

```tsx
import { Background } from "@/src/lib/shared/ui/Background";

<div style={{ position: "relative", overflow: "hidden", height: 600 }}>
  <Background />
</div>;
```

## Rules and gotchas

- The parent must be positioned and clip overflow: the element is `position: absolute`, `60vw`
  wide (`1000px × 600px` below the `md` breakpoint) and moves `200px` sideways, so an unclipped
  parent shows it sliding past its edge.
- The image is a CSS `background-image` from `public/images`, so it is not part of the
  server-rendered content and carries no alt text — never use it for anything meaningful.
- The `moving` keyframes have no `reducedMotion` override; wrap the parent in that mixin if the
  component is revived for a visible screen.

## Storybook

`Shared/Background` — `Default`.
