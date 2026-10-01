# BGImage

The full-bleed page background: a fixed, viewport-sized image behind all content with a
dimming overlay on top. It shows a game's artwork, a user's background, or the default moon
image, and cross-fades when the source changes.

## When to use

- Once per page, as the first child of the page component (`GamesPage`, `HubPage`,
  `UserProfile`, `MainPage`, the game page).
- Pass `game` on game pages, `userImage` on profiles, nothing elsewhere.
- Not for an image inside content — use `next/image` or a cover component instead.

## API

| Prop        | Type            | Default | Purpose                                                                                                                                                                                    |
| ----------- | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `game`      | `IGameResponse` | —       | Picks the background from `getGameBackgrounds(game)`: the chosen `backgroundImage` if it is one of the game's own artworks/screenshots, otherwise its artworks, otherwise its screenshots. |
| `userImage` | `string`        | —       | Used when there is no game image (a profile's background).                                                                                                                                 |

Source priority: game image → last game image shown → `userImage` → the signed-in user's
`profile.background` → `/images/moon.jpg`.

## Usage

```tsx
import { BGImage } from "@/src/lib/shared/ui/BGImage";

<BGImage game={game} />;
<BGImage userImage={displayUser.background} />;
```

## Rules and gotchas

- Every content block on a page that renders `BGImage` must sit inside a `Box`; text placed
  straight on the page background is washed out by whatever artwork is showing.
- The game image is picked from a hash of `game._id`, never `Math.random()`: a random pick
  differs between server and client and fails hydration on `src`.
- The overlay opacity is `bgOpacityPreview` (settings store, live slider preview) →
  `profile.settings.bgOpacity` → `DEFAULT_BG_OPACITY`. Do not persist the preview value.
- Adult games show no artwork when `useHideAdult()` is true (which includes an unresolved or
  blocked geo lookup); the previous/default image is used instead.
- The wrapper is `position: fixed` with `z-index: -1`. Any non-positioned ancestor with its
  own background paints over it, so nothing between it and the root may set an opaque
  background.
- It reads zustand stores and uses hooks, and carries no `"use client"`: import it from a
  client page, never directly into a route under `src/app/`.

## Storybook

`Shared/BGImage`: `Default`, `GameArtwork`, `UserBackground`. Each story wraps the image in a
positioned `z-index: 0` container so the fixed background is not hidden behind the preview's
page background.
