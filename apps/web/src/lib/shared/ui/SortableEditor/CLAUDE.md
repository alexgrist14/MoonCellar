# SortableEditor

A reorder editor with its footer: `SortableGrid` on top, then a muted note on the left and
Cancel/Save buttons on the right. The caller keeps the order in a draft; this component only
reports the two decisions.

## When to use

- Any "edit the order, then save or discard" panel — favourite games, favourite characters.
- Not when the editor saves in a different way (a custom list's Manage mode, which deletes on
  remove and has its own Done) — use `SortableGrid` directly there.
- Not for a static grid of covers.

## API

Every `SortableGrid` prop (`items`, `getKey`, `getName`, `renderCover`, `onChange`, `onRemove`,
`coverRatio`, `emptySlots`, `isDisabled`, `isRemovable`, `className`) is passed through to the
grid; `className` lands on the grid's `ol`. In addition:

| Prop               | Type         | Default                                | Purpose                                                     |
| ------------------ | ------------ | -------------------------------------- | ----------------------------------------------------------- |
| `onCancel`         | `() => void` | required                               | Cancel button; usually drops the draft.                     |
| `onSave`           | `() => void` | required                               | Save button; the caller writes the draft.                   |
| `isBusy`           | `boolean`    | –                                      | Disables both buttons and the grid while a save is pending. |
| `note`             | `ReactNode`  | `"Drag or use the arrows to reorder."` | Text on the left of the footer; an empty value hides it.    |
| `cancelLabel`      | `string`     | `"Cancel"`                             | Cancel button text.                                         |
| `saveLabel`        | `string`     | `"Save"`                               | Save button text.                                           |
| `wrapperClassName` | `string`     | –                                      | Class on the outer wrapper.                                 |

## Usage

```tsx
import { SortableEditor } from "@/src/lib/shared/ui/SortableEditor";

{
  !!draft && (
    <SortableEditor
      items={draft}
      getKey={(game) => game._id}
      getName={(game) => game.name}
      renderCover={(game) => <GameCoverImage game={game} sizes="160px" />}
      onChange={setDraft}
      coverRatio="var(--cover-ratio)"
      className={styles.slots}
      note={`Drag or use the arrows to reorder. The first ${LIMIT} are shown on your profile.`}
      isBusy={isPending}
      onCancel={() => setDraft(null)}
      onSave={handleSave}
    />
  );
}
```

## Rules and gotchas

- Keep the order in a draft and write it only from `onSave`; never on every move.
- The grid's columns and gap still go through `--sortable-grid-columns`/`--sortable-grid-gap`
  on `className` — see `SortableGrid`.
- Both buttons are `type="button"`, so the editor is safe inside a `<form>`.
- Generic component with a `"use client"` boundary: `getKey`/`renderCover` are functions, so
  render it from a client component.

## Storybook

`Shared/SortableEditor`: `Default`, `CustomNote`, `Busy`, `WithoutNote`, `WithEmptySlots`.
