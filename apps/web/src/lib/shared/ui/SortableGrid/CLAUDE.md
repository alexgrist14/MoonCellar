# SortableGrid

The drag-and-drop reorder editor. Each item is a slot with a cover, a grip, move-left/remove/
move-right buttons and a caption; empty placeholder slots can follow. Dragging uses native HTML5
drag events, and the arrow buttons give the same result by click and keyboard.

## When to use

- Every reorder editor: favourite games, favourite characters, a custom list's Manage mode,
  the profile's list order.
- Not for a static grid of covers: use `GamesCards` (widgets) or a plain grid.
- When the editor has the usual note plus Cancel/Save footer, use `SortableEditor`, which wraps
  this grid with it.

## API

| Prop          | Type                     | Default  | Purpose                                                                |
| ------------- | ------------------------ | -------- | ---------------------------------------------------------------------- |
| `items`       | `T[]`                    | required | Items in their current order                                           |
| `getKey`      | `(item: T) => string`    | required | Stable React key                                                       |
| `getName`     | `(item: T) => string`    | required | Caption and the name in button labels ("Move X left")                  |
| `renderCover` | `(item: T) => ReactNode` | required | Cover content of a slot                                                |
| `onChange`    | `(items: T[]) => void`   | required | New order after a drag, an arrow click, or a remove without `onRemove` |
| `onRemove`    | `(item: T) => void`      | –        | Replaces the default remove (filter + `onChange`)                      |
| `coverRatio`  | `string`                 | –        | `aspect-ratio` of every cover (`"var(--cover-ratio)"`)                 |
| `emptySlots`  | `number`                 | `0`      | "Empty slot" placeholders after the items                              |
| `isDisabled`  | `boolean`                | –        | Turns off dragging and every button (while saving)                     |
| `isRemovable` | `boolean`                | `true`   | Shows the remove button                                                |
| `className`   | `string`                 | –        | Class on the `ol`                                                      |

The props type is exported as `ISortableGridProps<T>`.

## Usage

```tsx
import { SortableGrid } from "@/src/lib/shared/ui/SortableGrid";

<SortableGrid
  items={draft}
  getKey={(game) => game._id}
  getName={(game) => game.name}
  renderCover={(game) => <GameCoverImage game={game} sizes="160px" />}
  onChange={setDraft}
  coverRatio="var(--cover-ratio)"
  className={styles.slots}
/>;
```

## Rules and gotchas

- Keep the order in a draft and save it from the consumer's own Save/Done. Never write the order
  to the server on every move.
- Set columns and gap through `--sortable-grid-columns` and `--sortable-grid-gap` on the class
  you pass, never with `grid-template-columns`/`gap`: equal specificity across CSS modules wins in
  development and loses in a production chunk.
- A custom list's editor passes `onRemove` to delete the game on the server at once, because
  `PATCH …/reorder` must receive exactly the list's games.
- Nothing rendered by `renderCover` may carry an appear `animation`: reordering moves DOM nodes
  and the browser restarts it on every move. Use a `transition`.
- The move and remove controls are compact transparent icon-only `Button`s named by
  `aria-label`; the module only sets their muted colour, the flip of the left arrow and the
  danger hover.
- Native drag does not work on touch screens; the arrow buttons are the mobile path, so do not
  hide them.

## Storybook

`Shared/SortableGrid`: Default, WithEmptySlots, NotRemovable, Disabled.
