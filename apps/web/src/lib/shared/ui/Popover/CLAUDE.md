# Popover

A controlled floating panel anchored to an element. On desktop it is a blurred `Box` positioned
below (or, without room, above) the anchor and clamped to the viewport; on mobile
(`useStatesStore().isSmall`, viewport ≤ 500px — `$screenSm`) the same props render `PopoverSheet`, a bottom sheet with a
backdrop, a drag handle and, when `title` is set, a heading. Both portal into `#dropdown-connector`.

## When to use

- A small menu or panel opened from a button: `ActionsMenu`, the game card's "External links"
  (`GameControls`), `GameExternalPages`, `TabsMenu`, `Dropdown`'s mobile list.
- Not for long reading content — use `drawer.open` (`Drawer`).
- Not for a blocking dialog or a form — use `modal.open` (`Modal`).
- Not for a list of choices bound to a field — use `Dropdown`.
- A search-as-you-type listbox under an input (`ListGameSearch`) is the anchored mode:
  `matchAnchorWidth` + `isSheetDisabled`, the input's wrapper as `anchorRef`, `isOpen` driven
  by the query. A sheet would put a backdrop over the input and lock the page while typing.
- Not for a hover hint — use `Tooltip`.

## API

| Prop               | Type                             | Default                                       | Purpose                                                                  |
| ------------------ | -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `anchorRef`        | `RefObject<HTMLElement \| null>` | —                                             | Element to position against; clicks on it do not count as outside.       |
| `isOpen`           | `boolean`                        | —                                             | Whether the panel is rendered.                                           |
| `onClose`          | `() => void`                     | —                                             | Called on outside mousedown, Escape, or (sheet) close/drag-dismiss.      |
| `children`         | `ReactNode`                      | —                                             | Panel content.                                                           |
| `align`            | `"start" \| "end"`               | `"start"`                                     | Align the panel's left edge, or right edge, with the anchor (desktop).   |
| `title`            | `string`                         | —                                             | `Box` title on desktop; heading and `aria-label` of the sheet.           |
| `width`            | `string`                         | `var(--popover-width)` (320px)                | Panel width on desktop.                                                  |
| `className`        | `string`                         | —                                             | Class on the positioned root / the sheet.                                |
| `classNameContent` | `string`                         | —                                             | Class on the content element.                                            |
| `contentStyle`     | `CSSProperties`                  | `{ padding: "var(--padding-x4)" }` on desktop | Style on the content element.                                            |
| `matchAnchorWidth` | `boolean`                        | —                                             | Panel width follows the anchor's width (overrides `width`).              |
| `isSheetDisabled`  | `boolean`                        | —                                             | Never switch to the bottom sheet: stays anchored on mobile, no backdrop. |
| `reservedHeight`   | `number`                         | `0`                                           | Height in px the below/above choice assumes, if larger than the panel.   |

`PopoverSheet` takes the same props minus `align`/`width`, plus `sheetRef`; import it from
`./PopoverSheet` only to force the sheet regardless of `isSmall`, as `Dropdown` does.

## Usage

```tsx
import { Popover } from "@/src/lib/shared/ui/Popover";

const anchorRef = useRef<HTMLButtonElement>(null);
const [isOpen, setIsOpen] = useState(false);

<>
  <Button
    ref={anchorRef}
    aria-expanded={isOpen}
    onClick={() => setIsOpen((v) => !v)}
  >
    Manage
  </Button>
  <Popover
    anchorRef={anchorRef}
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    align="end"
    width="220px"
  >
    <ActionsList />
  </Popover>
</>;
```

## Rules and gotchas

- **Content that grows while open (search results) passes `reservedHeight` with its largest
  height.** The side is picked from the panel's current height and re-checked on every resize, so
  a "Searching…" line fits below and the full result list then flips the panel above the anchor —
  a visible jump on every search. With the reserve the side is chosen once for the biggest state;
  the panel still renders at its real height. `SearchPicker` reserves 440px, eight result rows.
- **A panel opened above the anchor is positioned by `bottom`, never by a computed `top`.** With
  `top = anchor.top - height` the panel grew downward over the anchor for one frame whenever its
  content grew, until `ResizeObserver` recomputed it — a flash below, then a jump up. Pinned by
  `bottom`, the browser grows it upward in the same layout pass.
- Toggle from the anchor's `onClick` and pass the same element as `anchorRef`; the anchor is
  excluded from outside clicks, so toggling does not close and immediately reopen it.
- The root stops propagation of every click inside it, because a portal still bubbles React
  events to the component it was opened from — a card `Link` would navigate to the game. It must
  never call `preventDefault` instead: that also cancels the native default of everything inside,
  so an `<a target="_blank">` in the panel (the RetroAchievements rows) did nothing on click and a
  checkbox could not be ticked.
- It needs `#dropdown-connector` (mounted after `ModalsConnector` in `Layout`, so it stays above
  modals); without it the panel falls back to `document.body`.
- Clicks inside `#modals` do not close a popover opened outside a modal, so a confirm modal
  launched from the popover leaves it open behind.
- The sheet locks page scroll with `useDisableScroll` while open and carries the `ExpandMenu`
  keep-open attribute, so opening it from an expanded menu does not collapse that menu.
- Desktop and mobile differ: `width`, `align` and the default padding apply only to the anchored
  panel; the sheet is full-width with its own padding.

- **The sheet has no visible close button.** It closes by dragging down, tapping the backdrop or
  Escape; a visible ✕ duplicated those and, without a `title`, left an empty header row above the
  content. A visually hidden "Close" button stays as the first control for screen readers, which
  cannot drag. Pass `title` only when the content does not explain itself (a sub-panel, the
  options of a field), not to repeat the trigger's label.
- Untitled, the anchored panel has no title chrome (`Box` renders no head without `title`).
- The anchored mode never takes focus: keyboard navigation stays with the anchor (handle
  arrows/Enter on the input, keep the active option in state), and Escape or an outside
  mousedown calls `onClose`. Give long content a `max-height` (`var(--popover-max-height)`: 320px, 60dvh at 768px and below, where the popover is a sheet)
  and scroll; a panel taller than the space on both sides is clamped and covers the anchor.

## Storybook

`Shared/Popover` — `Default`, `AlignEnd`, `WithTitle`, `MobileSheet`, `MobileSheetUntitled`, `AnchoredSearch`,
`AnchoredSearchReservedHeight` (opens above even for one short result),
`AnchoredSearchOnMobile`.
