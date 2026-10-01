# VideosRow

Horizontal rail of YouTube thumbnails inside a `Scrollbar` with arrows. Clicking a thumbnail opens
the video in a modal with an autoplaying embed. Each thumbnail shows a `Loader` until its image
loads, then a play icon.

## When to use

- The videos panel of a game's media section (`GameMedia`).
- For screenshots and artworks use `Slideshow`.

## API

| Prop     | Type       | Default | Purpose                                        |
| -------- | ---------- | ------- | ---------------------------------------------- |
| `videos` | `string[]` | —       | YouTube ids or URLs; empty strings are skipped |

## Usage

```tsx
import { VideosRow } from "@/src/lib/shared/ui/VideosRow";

<VideosRow videos={game.videos} />;
```

## Rules and gotchas

- **The player is opened through `modal.open` with a `useId` id,** so `ModalsConnector` must be
  mounted. The effect's cleanup closes only that id: it never touches other modals and does
  nothing on mount. Closing the player (overlay, Escape, navigation) resets the selected video.
- **Thumbnails come from `img.youtube.com`** via `next/image`; that host must stay in
  `images.remotePatterns`.
- **The tile hover ring is an inset `outline`, not a transparent `border`,** and the image
  inherits the radius; a border shows the tile background along the rounded corners.

## Storybook

`Shared/VideosRow` — `Default`, `SingleVideo`.
