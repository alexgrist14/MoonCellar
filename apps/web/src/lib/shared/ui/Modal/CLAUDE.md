# Modal

The app's modal system: an imperative `modal` API plus the `ModalsConnector` that renders a
stack of modals into `#modals`. Each entry is wrapped in `Modal`, which adds the overlay
(click to close) and an optional resize handle.

## When to use

- Any dialog: `modal.open(<Content />, params)`. The content brings its own panel (usually a
  `Box`, or `ConfirmModal`).
- Long reading content that should sit beside the page goes in the drawer
  (`drawer.open` from `shared/ui/Drawer`), not a modal.
- Never mount a second `ModalsConnector` or render `Modal` directly; it is internal.

## API

`modal` (exported from the barrel):

| Method        | Signature                                              | Purpose                                                          |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `modal.open`  | `(component: ReactNode, props?: IModalParams) => void` | Pushes a modal on the stack; without an `id` it generates one.   |
| `modal.close` | `(id?: string) => void`                                | Closes the modal with that `id`; with no id, closes all of them. |

`IModalParams` (second argument of `open`):

| Prop          | Type         | Default   | Purpose                                                                                                    |
| ------------- | ------------ | --------- | ---------------------------------------------------------------------------------------------------------- |
| `id`          | `string`     | generated | Identity for `modal.close(id)`; also set as the DOM id of the modal.                                       |
| `onClose`     | `() => void` | —         | Called on an overlay click, on Escape, and for every open modal when all close on navigation / `popstate`. |
| `isResizable` | `boolean`    | —         | Adds a `ResizeHandle` to the content.                                                                      |

`ModalsConnector` takes no props; it is mounted once in `Layout` (and in Storybook's global
decorator).

## Usage

```tsx
import { modal } from "@/src/lib/shared/ui/Modal";
import { Box } from "@/src/lib/shared/ui/Box";

modal.open(
  <Box title="Achievements">
    <p>12 of 63 unlocked</p>
  </Box>,
  { id: "achievements", onClose: () => setSelected(undefined) }
);

modal.close("achievements");
```

## Rules and gotchas

- `modal.open` stores the JSX it is given; props passed at open time never update when the
  opener re-renders. A modal that needs live state (pending, form values) owns it, as
  `ConfirmModal` does.
- Modals never push history entries. `ModalsConnector` closes all modals on `popstate` and
  on every pathname change, so Back/Forward dismisses the modal and still navigates.
- `modal.close()` without an id closes the whole stack, including modals underneath. Pass an
  id when closing a modal opened from another modal.
- `modal.open` assigns a generated id when none is given, so an overlay click (which calls
  `modal.close(id)`) and Escape only ever close that one modal. Pass your own `id` when the
  opener needs to close it later.
- `onClose` is not called by `modal.close(...)` — only by an overlay click, by Escape and by
  the close-all on navigation. A component that tracks "is my modal open" in state must reset
  it in `onClose`.
- Escape closes the top modal only when the key event reaches `#modals`, i.e. focus is
  inside a modal.
- Page scroll is frozen once, from `ModalsConnector`, via `useDisableScroll`. Do not call it
  from an individual modal.
- A modal's height cap is `dvh`, never plain `vh` (keep a `vh` line before it as fallback):
  mobile `vh` ignores the browser toolbars and pushes the bottom of the panel off-screen.
- A `Dropdown` inside a modal needs `isThroughPortal`, or the modal's scroll area clips its
  list.

## Storybook

`Shared/Modal`: `Default` (opens a `Box` modal), `Stacked` (a modal that opens a second one
and closes it by id), `Resizable`.
