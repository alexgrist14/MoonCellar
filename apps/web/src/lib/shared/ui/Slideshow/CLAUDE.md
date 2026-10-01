# Slideshow

A horizontal rail of screenshots with arrow buttons. Clicking a tile opens the picture
full-size in a modal with previous/next buttons, arrow-key and swipe navigation.

## When to use

- A game's screenshots or artworks on the game page (`GameMedia`).
- Videos go in `VideosRow`; a single image is plain `next/image`.

## API

| Prop       | Type       | Default | Purpose                                                              |
| ---------- | ---------- | ------- | -------------------------------------------------------------------- |
| `pictures` | `string[]` | —       | Image URLs, in display order. Empty strings are skipped in the rail. |

## Usage

```tsx
import { Slideshow } from "@/src/lib/shared/ui/Slideshow";

<Slideshow pictures={game.screenshots ?? []} />;
```

## Rules and gotchas

- The viewer opens through `modal.open`, so `ModalsConnector` must be mounted.
- The viewer is opened with a `useId` id, and the effect's cleanup closes only that id, so it
  never touches other modals and does nothing on mount. A new `pictures` identity while the
  viewer is open reopens it with the new array.
- Every way of closing (a click on the picture, the overlay, Escape, navigation) resets the
  selected index, so clicking the same tile again reopens the viewer.
- The tiles are rounded image tiles: the hover ring is an inset `outline`
  (`outline-offset: -2px`), not a transparent `border`, and the `img` repeats the radius
  with `border-radius: inherit`. A border shows the tile background as a light edge on the
  corners. See `docs/rounded-tiles.md` for why scroll snapping was rolled back.
- Arrow keys are ignored while focus is in an `input`, `textarea` or `contenteditable`.
- A swipe sets a flag so the click that ends it does not close the viewer.
- Images go through `next/image`; remote hosts must be allowed in `next.config.mjs`, and
  image URLs must never be served from under `/api` (crawlers are disallowed there).
- Uses hooks and has no `"use client"`: import it from a client component only.

## Storybook

`Shared/Slideshow`: `Default`, `SinglePicture` (prev/next disabled in the viewer),
`ManyPictures`.
