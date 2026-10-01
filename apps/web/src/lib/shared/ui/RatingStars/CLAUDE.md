# RatingStars

A row of ten `SvgStar` icons filled proportionally to a 0–10 rating (fractions fill part of a
star), with the numeric rating in a tooltip.

## When to use

- Showing a user's own score for a game on a 10-point scale (the profile's games list).
- Not for input — it is read-only and has no click or keyboard handling.

## API

| Prop        | Type        | Default | Purpose                                       |
| ----------- | ----------- | ------- | --------------------------------------------- |
| `rating`    | `number`    | —       | Rating from 0 to 10; fractions fill partially |
| `size`      | `ISvgSizes` | `"16"`  | Star size (`"12"` … `"40"`)                   |
| `className` | `string`    | —       | Extra class on the stars row                  |

## Usage

```tsx
import { RatingStars } from "@/src/lib/shared/ui/RatingStars";

<RatingStars rating={game.rating} size="12" />;
```

## Rules and gotchas

- **The scale is fixed at ten stars.** A 5-point or 100-point value must be converted to 0–10
  before it is passed in.
- **The value is only exposed through the tooltip;** where the rating matters to a screen-reader
  user, render the number in text next to it as well.

## Storybook

`Shared/RatingStars` — `Default`, `Fractional`, `Full`, `Empty`, `Large`.
