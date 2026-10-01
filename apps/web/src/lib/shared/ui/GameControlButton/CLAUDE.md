# GameControlButton

The round icon button used for per-game actions on cards and the game page (favourite,
add to list, playthrough status). It wraps a transparent `Button` and adds a tone colour, an
active ring, an optional count badge and the ARIA state attributes. The folder also exports
`getPlaythroughsTone`, which picks the tone that represents a set of playthroughs.

## When to use

- One action on one game, shown as an icon in the game controls row.
- The composed row of these buttons (favourite + lists + status) is the `GameControls`
  widget; this component knows nothing about favourites or lists.
- A generic icon button anywhere else is a plain `Button` with `isOnlyIcon`.

## API

| Prop           | Type                                     | Default | Purpose                                                                     |
| -------------- | ---------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `icon`         | `ReactNode`                              | —       | The glyph, usually an `Svg*` at `size="16"`.                                |
| `label`        | `string`                                 | —       | Accessible name (`aria-label`). Required: the button has no visible text.   |
| `tooltip`      | `string`                                 | —       | Tooltip text from `Button`.                                                 |
| `tooltipAlign` | `"left" \| "right" \| "center"`          | —       | Tooltip alignment.                                                          |
| `tone`         | `CategoriesType \| "favorite" \| "list"` | —       | Colour used for the icon and ring while `isActive`.                         |
| `badge`        | `number`                                 | —       | Count bubble in the corner; `0`/`undefined` hides it.                       |
| `isActive`     | `boolean`                                | —       | Applies the tone colour and ring.                                           |
| `isDisabled`   | `boolean`                                | —       | Dims the button and swallows clicks (sets `aria-disabled`, not `disabled`). |
| `isPressed`    | `boolean`                                | —       | `aria-pressed` for toggles (favourite).                                     |
| `isExpanded`   | `boolean`                                | —       | `aria-expanded` for buttons that open a popover (lists).                    |
| `onClick`      | `() => void`                             | —       | Click handler; not called while `isDisabled`.                               |
| `ref`          | `Ref<HTMLButtonElement>`                 | —       | Anchor for a popover.                                                       |

`getPlaythroughsTone(playthroughs?: IPlaythroughMinimal[])` returns `"mastered"` if any
playthrough is mastered, otherwise the highest category in `playthroughPriorityOrder`, or
`undefined` for none.

## Usage

```tsx
import { GameControlButton } from "@/src/lib/shared/ui/GameControlButton";
import { SvgHeart, SvgHeartFilled } from "@/src/lib/shared/ui/svg";

<GameControlButton
  icon={isFavorite ? <SvgHeartFilled size="16" /> : <SvgHeart size="16" />}
  label={isFavorite ? "Remove from favourites" : "Add to favourites"}
  tone="favorite"
  isActive={isFavorite}
  isPressed={isFavorite}
  onClick={toggleFavorite}
/>;
```

## Rules and gotchas

- The click handler calls `preventDefault` and `stopPropagation`, because the button sits
  inside a `GameCard` `Link`; a click must not navigate to the game. It also carries
  `data-prevent-progress` so the navigation progress bar does not start.
- `isDisabled` keeps the button focusable and announces it with `aria-disabled`; a tooltip
  explaining why it is disabled therefore still works.
- The tone is only visible while `isActive`; an inactive button is neutral whatever `tone`
  is.

## Storybook

`Shared/GameControlButton`: `Default`, `Favorite`, `FavoriteInactive`, `ListWithBadge`,
`PlaythroughTones`, `Disabled`.
