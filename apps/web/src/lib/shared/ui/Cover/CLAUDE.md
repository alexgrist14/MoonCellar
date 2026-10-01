# Cover

The placeholder shown where a game has no cover image: the MoonCellar logo on a tertiary
background with the `--cover-ratio` aspect ratio, and an optional "Cover Missing" caption.

## When to use

- As the fallback of a game cover (`GameCoverImage`), or where a game thumbnail is expected but
  absent (`ActivityTimeline`, `ListGameSearch`, `UserReviewItem`).
- A real cover goes through `GameCoverImage` (entities), not through this component.

## API

| Prop            | Type            | Default | Purpose                                              |
| --------------- | --------------- | ------- | ---------------------------------------------------- |
| `className`     | `string`        | –       | Extra class on the root                              |
| `isWithoutText` | `boolean`       | –       | Hides the "Cover Missing" caption (small thumbnails) |
| `style`         | `CSSProperties` | –       | Inline style on the root                             |

## Usage

```tsx
import { Cover } from "@/src/lib/shared/ui/Cover";

{
  game.cover ? (
    <Image src={game.cover} alt={game.name} fill />
  ) : (
    <Cover isWithoutText />
  );
}
```

## Rules and gotchas

- It fills its parent (`width/height: 100%`); size it through the parent, or through `className`
  when the parent has no size.
- Its radius is `--radius-x4`, the cover style, independent of nesting depth.

## Storybook

`Shared/Cover`: Default, WithoutText, Thumbnail.
