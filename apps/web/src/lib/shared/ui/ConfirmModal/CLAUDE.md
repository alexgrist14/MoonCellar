# ConfirmModal

A small confirmation dialog: title, message, optional warning line, and Cancel / confirm
buttons (the confirm button is red). Meant to be opened through `modal.open` before a
destructive action.

## When to use

- Before deleting or irreversibly changing something (delete a list, a comment, a game, a
  character).
- Not for forms or anything with input — build a `Box`-based modal for that.
- For a title plus a list of icon/text rows, ask whether `RowsModal` fits instead.

## API

| Prop          | Type                             | Default    | Purpose                                     |
| ------------- | -------------------------------- | ---------- | ------------------------------------------- |
| `title`       | `string`                         | —          | Heading (`h3`).                             |
| `message`     | `ReactNode`                      | —          | Body text, rendered inside a `<p>`.         |
| `warning`     | `string`                         | —          | Optional extra line in the warning style.   |
| `confirmText` | `string`                         | `"Delete"` | Label of the red confirm button.            |
| `cancelText`  | `string`                         | `"Cancel"` | Label of the cancel button.                 |
| `onConfirm`   | `() => void \| Promise<unknown>` | —          | Called on confirm; may return a promise.    |
| `onCancel`    | `() => void`                     | —          | Called on cancel; usually closes the modal. |

## Usage

```tsx
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";

const DELETE_MODAL_ID = "delete-list";

modal.open(
  <ConfirmModal
    title="Delete list"
    message="Delete “Metroidvanias”? The games stay in your categories."
    warning="Links to this list will stop working."
    onCancel={() => modal.close(DELETE_MODAL_ID)}
    onConfirm={async () => {
      await deleteList(listId);
      modal.close(DELETE_MODAL_ID);
    }}
  />,
  { id: DELETE_MODAL_ID }
);
```

## Rules and gotchas

- The pending state lives inside the component: both buttons are disabled from the click
  until `onConfirm` settles. This exists because `modal.open` stores the JSX once, so a
  `disabled` prop passed from the opener would never update.
- If `onConfirm` throws or rejects, the buttons re-enable; if it resolves, they stay disabled.
  The modal never closes itself — close it inside `onConfirm` (or let the caller's success
  path do it).
- `message` is wrapped in a `<p>`, so pass inline content only; a block element inside it
  is invalid HTML.
- Give the modal an `id` and close by that id, so closing the confirmation does not also
  close the modal it was opened from.

## Storybook

`Shared/ConfirmModal`: `Default`, `WithWarning`, `CustomLabels`, `LongMessage`, `InModal`
(a button that opens it through `modal.open`).
