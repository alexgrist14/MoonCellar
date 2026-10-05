# ExpandMenu

A side panel docked to a screen edge with a vertical tab ("Filters", "Manage", "Admin") that
opens and closes it. It portals into `#expand-connector`; which panels are open lives in
`useExpandStore`, keyed by `position`.

## When to use

- Page-level tool panels: catalogue filters and the Manage panel on `/games`, a custom list's
  Manage mode, the profile Menu, admin controls on game pages.
- Long content beside the page (reviews, character details) goes in the drawer
  (`drawer.open` from `shared/ui/Drawer`), not in a hand-rolled panel or a new `ExpandMenu`.

## API

| Prop             | Type                                                   | Default   | Purpose                                                                    |
| ---------------- | ------------------------------------------------------ | --------- | -------------------------------------------------------------------------- |
| `children`       | `ReactNode`                                            | –         | Panel content (wrapped in the shared `Scrollbar`)                          |
| `position`       | `"left" \| "right" \| "bottom-left" \| "bottom-right"` | `"left"`  | Edge the panel docks to; also its key in the expand store and its DOM `id` |
| `titleOpen`      | `string \| ReactNode`                                  | `"Open"`  | Tab label while closed                                                     |
| `titleClose`     | `string \| ReactNode`                                  | `"Close"` | Tab label while open                                                       |
| `titleClassName` | `string`                                               | –         | Class on the tab                                                           |
| `titleStyle`     | `CSSProperties`                                        | –         | Inline style on the tab                                                    |

`EXPAND_KEEP_OPEN_ATTRIBUTE` (`"data-keep-expand-open"`): an outside click on an element inside
something carrying this attribute does not close the panel.

## Usage

```tsx
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";

<ExpandMenu position="left" titleOpen="Filters">
  <Filters />
</ExpandMenu>
<ExpandMenu position="right" titleOpen="Manage">
  <GamesListMenu games={games} />
</ExpandMenu>
```

## Rules and gotchas

- **A page with a `left` or `right` menu must be listed in `Layout`'s `TOP_MENU_ROUTES` (exact
  path) or `TOP_MENU_PATTERNS` (a dynamic route such as `/user/<name>/lists/<slug>`).** The
  buttons are `position: fixed` under the header, and only `container_topMenu` pushes the page
  down below them on screens up to `$screenExpandOverlap` (1759px); without it the "Filters"
  button sits on top of the breadcrumbs and the title. The list is matched on the server, so the
  offset is right from the first paint — do not replace it with a flag the menu sets on mount,
  which would shift the content after hydration.
- `#expand-connector` must exist (it is in `Layout`). The component looks it up in `useEffect`
  and renders nothing until then; looking it up during render failed hydration on every game page.
- Use each `position` once per page: two menus on the same edge share one store key and open
  together.
- It closes on any outside `mousedown` and on Escape. To keep it open while the user clicks
  elsewhere (select mode clicking cards), put `EXPAND_KEEP_OPEN_ATTRIBUTE` on those elements,
  as `GameCard` and `PopoverSheet` do; a panel pinned for any other reason traps the user.
- Opening the drawer clears `useExpandStore`, and expanding a menu closes the drawer, so the two
  never overlap. Do not set the store from elsewhere without keeping that contract.
- A full-height panel is sized with `100dvh`, never `100vh`, or its bottom sits under the mobile
  browser toolbar.

## Storybook

`Shared/ExpandMenu`: Closed, Open, BottomRight.
