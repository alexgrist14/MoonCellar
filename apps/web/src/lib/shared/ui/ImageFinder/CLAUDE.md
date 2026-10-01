# ImageFinder

A search field plus a grid of candidate images to pick from. The caller supplies the search
(`onSearch` returns image URLs); the component keeps the query and the result grid and reports
the picked URLs through `onChange`. Used by the admin game editor (cover, screenshots,
artworks) and the character editor.

## When to use

- Letting an editor pick one or several images from an external search before saving.
- Not for uploading a local file (`AvatarSettings` / a file input) and not for displaying a
  gallery (`Slideshow`).

## API

| Prop           | Type                                   | Default            | Purpose                                                           |
| -------------- | -------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `label`        | `string`                               | —                  | Text of the search button.                                        |
| `defaultQuery` | `string`                               | —                  | Initial query (e.g. the game name) until the user edits it.       |
| `onSearch`     | `(query: string) => Promise<string[]>` | —                  | Returns candidate image URLs.                                     |
| `selected`     | `string[]`                             | —                  | Picked URLs (controlled).                                         |
| `onChange`     | `(selected: string[]) => void`         | —                  | Receives the new selection.                                       |
| `isMultiple`   | `boolean`                              | —                  | Allows several picks; otherwise a pick replaces the previous one. |
| `isPortrait`   | `boolean`                              | —                  | 3:4 tiles (covers) instead of 16:9.                               |
| `isDisabled`   | `boolean`                              | —                  | Disables the query field and the button.                          |
| `emptyText`    | `string`                               | `"Nothing found."` | Shown when a search returns no URLs.                              |

## Usage

```tsx
import { ImageFinder } from "@/src/lib/shared/ui/ImageFinder";

<ImageFinder
  label="Find cover"
  defaultQuery={game.name}
  isPortrait
  selected={coverPicks}
  onChange={setCoverPicks}
  onSearch={searchCovers}
/>;
```

## Rules and gotchas

- **Nothing is searched on mount;** the grid appears only after the button or Enter.
- **A rejected `onSearch` is swallowed** and hides the grid (no empty text). Error reporting is
  the API interceptor's job, so do not add a toast in `onSearch`.
- **Enter in the field calls `preventDefault`,** so it does not submit a surrounding form; the
  button has `type="button"`.
- Images render with `unoptimized`, so any remote host works without `next.config` changes.
- The picks are not saved by the component — the note says "applied on save", and the parent
  must send them with its own Save.
- The selected ring is an `::after` outline overlay, per the rounded-tile rule in
  `apps/web/CLAUDE.md`; keep it that way if the tile changes.
- No `"use client"`: import it from a client component.
- **Result tiles stay native `<button>`s.** Each one is an image tile with an `::after` selection ring and `aria-pressed`; `Button`'s padding, centring and ellipsis would cut the thumbnail.

## Storybook

`Shared/ImageFinder`: `Single`, `Multiple`, `Portrait`, `NothingFound`, `Disabled`.
