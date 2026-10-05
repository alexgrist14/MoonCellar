# Drawer

A side panel docked to the window's right edge under the header, opened imperatively with
`drawer.open(node, params)` from anywhere in the client. `DrawerConnector`, mounted once in
`Layout`, listens for the open/close events and renders the content inside a blurred, scrollable
`Box` with a title and a close button.

## When to use

- Long content shown beside the page without leaving it: a full review, a character list, the
  followers/following lists (`ExpandableBlock mode="drawer"`, `UserInfo`, `GameCharacters`).
- Not for a blocking dialog or a form that must be confirmed — use `modal.open` (`Modal`).
- Not for a small menu anchored to a button — use `Popover`.
- Never build a second panel on the right edge; it ends up on top of the bottom-right
  `ExpandMenu` menus.

## API

`drawer` (imperative):

| Member  | Type                                                     | Purpose                                        |
| ------- | -------------------------------------------------------- | ---------------------------------------------- |
| `open`  | `(component: ReactNode, params?: IDrawerParams) => void` | Shows `component`, replacing any open content. |
| `close` | `() => void`                                             | Closes the drawer.                             |

`IDrawerParams`:

| Param     | Type         | Default | Purpose                                          |
| --------- | ------------ | ------- | ------------------------------------------------ |
| `title`   | `string`     | —       | `Box` title and the panel's `aria-label`.        |
| `onClose` | `() => void` | —       | Called whenever the drawer closes, by any route. |

Also exported: `DrawerConnector` (no props), `DRAWER_TRIGGER_ATTRIBUTE`
(`"data-drawer-trigger"`), `drawerEvents` (the underlying `EventEmitter`).

## Usage

```tsx
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";

<Button
  {...{ [DRAWER_TRIGGER_ATTRIBUTE]: "" }}
  onClick={() =>
    drawer.open(<FollowersList userId={user._id} />, { title: "Followers" })
  }
>
  Followers
</Button>;
```

## Rules and gotchas

- `DrawerConnector` must be mounted exactly once (it is, in `Layout`); without it `drawer.open`
  emits into nothing, and two connectors render two panels.
- Every element that opens the drawer carries `data-drawer-trigger`. The drawer closes on an
  outside `mousedown`, which fires before `click`, so without the attribute clicking the next
  "Show more" closes and reopens the panel instead of swapping content in place.
- Clicks inside `#modals`, `#dropdown-connector` and `#tooltip-connector` do not close it, so a
  dropdown or modal opened from drawer content keeps the drawer open. Escape is ignored while a
  modal is open.
- The drawer and `ExpandMenu` exclude each other: opening the drawer clears `useExpandStore`, and
  any menu that expands closes the drawer. It also closes on route change and on `popstate`.
- `open` stores the node it is given; later prop changes in the caller do not reach it. Content
  that needs live data must read it itself (a query hook or store inside the component).
- The panel is sized with `100dvh` and its `Box` gets
  `templateStyle={{ height: "100%", minHeight: 0 }}`; keep both, or on mobile the bottom of the scroll area sits below the screen.
- **On touch it closes with a swipe to the right** (`shared/hooks/useSwipeDismiss`, shared with
  `ExpandMenu`), by the same rule as `PopoverSheet`'s drag
  down: released past a third of its width or flicked faster than 0.5px/ms. The gesture only
  starts once the finger has moved 10px and more sideways than vertically. **`touch-action: pan-y`
  must sit on the scroll content (`drawer__content`), not only on the panel:** the browser reads
  `touch-action` only up to the nearest scroll container, so with it on the panel alone it took
  every sideways swipe as its own pan and sent `pointercancel` after the first move. Vertical
  scrolling of the content stays native. Mouse pointers are
  ignored, so text in the drawer stays selectable. The offset lives in `--drawer-offset`, which
  both transforms read; never set `transform` inline, or the open/close `scaleX` stops working.
- It is `role="dialog"` with `aria-modal="false"` and moves focus to its close button on open;
  give every drawer a `title` so the dialog has a name.

## Storybook

`Shared/Drawer` — `Default`, `LongContent`.
