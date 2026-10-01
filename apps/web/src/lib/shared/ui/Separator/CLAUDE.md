# Separator

A 2px rounded divider line in `--color-bg-hover`, vertical by default.

## When to use

- Dividing items in a row (the header's nav groups) or stacked blocks inside one panel.
- Not as a border substitute between `Box` panels — the gap between panels already separates
  them.

## API

| Prop        | Type                         | Default      | Purpose                                     |
| ----------- | ---------------------------- | ------------ | ------------------------------------------- |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | Orientation.                                |
| `style`     | `CSSProperties`              | —            | Inline overrides (margins, a fixed height). |

## Usage

```tsx
import { Separator } from "@/src/lib/shared/ui/Separator";

<nav style={{ display: "flex", gap: "var(--gap-x4)" }}>
  <Link href="/games">Games</Link>
  <Separator />
  <Link href="/lists">Lists</Link>
</nav>;
```

## Rules and gotchas

- **The vertical line is `height: 100%`,** so its parent needs a definite height or must be a
  flex row that stretches it; otherwise it collapses to nothing.
- It is a plain `div` with no `role="separator"`, so it is purely decorative for screen readers.

## Storybook

`Shared/Separator`: `Vertical`, `Horizontal`.
