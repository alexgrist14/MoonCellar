# ScoreValue

A score on a scale, written `7 / 10`, with the ` / 10` part muted and smaller.

## When to use

- Every user or average rating shown as a number: review headers, the reviews summary, rating
  lines in text.
- Not for star input — that is `RatingStars`. Not for the combined catalogue rating badge on
  a card.

## API

| Prop        | Type                       | Default | Purpose                                                                 |
| ----------- | -------------------------- | ------- | ----------------------------------------------------------------------- |
| `value`     | `number \| string`         | —       | The score. Pass a pre-formatted string for rounding (`"8.4"`).          |
| `max`       | `number`                   | `10`    | Upper end of the scale.                                                 |
| `size`      | `"inline" \| "md" \| "lg"` | `"md"`  | `inline` inherits the surrounding font; `md` 15px/600; `lg` 30px/600.   |
| `className` | `string`                   | —       | Extra class on the root `span` (placement such as `margin-left: auto`). |

## Usage

```tsx
import { ScoreValue } from "@/src/lib/shared/ui/ScoreValue";

{
  review.rating !== null && <ScoreValue value={review.rating} />;
}

<ScoreValue value={summary.averageRating} size="lg" />;
```

## Rules and gotchas

- It renders a `span` with `white-space: nowrap`, so the scale never wraps away from the
  number; placement in a row (pushing it to the right) is the consumer's `className`.
- `inline` keeps the colour and font of the text around it and only mutes the scale — use it
  inside sentences and meta lines.
- The rendered text reads `7 / 10` to a screen reader, which is what the old copies produced.
- It does not hide itself for a missing score; check `rating !== null` at the call site.

## Storybook

`Shared/ScoreValue`: `Medium`, `Large`, `Inline`, `CustomMax`, `Sizes`.
