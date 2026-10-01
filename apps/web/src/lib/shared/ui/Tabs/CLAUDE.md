# Tabs

A row of mutually exclusive switches built from `Button`. It tracks the selected index itself and
calls each tab's `onTabClick`; the consumer renders whatever the selected tab shows. Two looks:
the default `fancy` full-width tabs, and `theme="segmented"`, the compact pill switcher. With
`mobileMenuTitle` the row turns into a `TabsMenu` on small screens.

## When to use

- Every row of mutually exclusive switches: page tabs, sort toggles (comments Top/New, reviews
  sort), status filters. Never a hand-rolled row of buttons.
- Use `theme="segmented"` for sorting and filtering, the default theme for page sections.

## API

| Prop                | Type            | Default               | Purpose                                                                                                                                                                                                                                                        |
| ------------------- | --------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contents`          | `ITabContent[]` | required              | Tabs: `tabName`, optional `prefix` (node before the name, e.g. a status dot — spacing included), `tabNameNode` (node after the name), `count`, `onTabClick`, `tabLink`, `isUnselectable`, `isHidden`, `ariaLabel`, `tooltip`, `className`, `style` (see below) |
| `defaultTabIndex`   | `number`        | `0`                   | Initially selected tab (clamped to the last one)                                                                                                                                                                                                               |
| `isUseDefaultIndex` | `boolean`       | –                     | Re-syncs the selection whenever `defaultTabIndex` changes (controlled-ish use)                                                                                                                                                                                 |
| `isStopPropagation` | `boolean`       | –                     | Clicks call `onTabClick` but do not change the selection                                                                                                                                                                                                       |
| `resetCallback`     | `() => void`    | –                     | Called before every tab click                                                                                                                                                                                                                                  |
| `theme`             | `"segmented"`   | –                     | Pill switcher with `role="group"` and `aria-pressed`                                                                                                                                                                                                           |
| `ariaLabel`         | `string`        | –                     | Accessible name of the button row                                                                                                                                                                                                                              |
| `buttonColor`       | `ButtonColor`   | `FANCY` / `SEGMENTED` | Overrides the button theme                                                                                                                                                                                                                                     |
| `buttonsClassName`  | `string`        | –                     | Class on the button row                                                                                                                                                                                                                                        |
| `isAdaptive`        | `boolean`       | –                     | Viewport-scaled button size, centred row                                                                                                                                                                                                                       |
| `isHideTabsButtons` | `boolean`       | –                     | Renders the row without buttons                                                                                                                                                                                                                                |
| `mobileMenuTitle`   | `string`        | –                     | Below `$screenMd` hides the row and shows a `TabsMenu` with this title                                                                                                                                                                                         |
| `isWrap`            | `boolean`       | –                     | Lets a `segmented` row wrap onto several lines instead of overflowing its container                                                                                                                                                                            |

Per-tab fields beyond the label:

- `isHidden` — the tab is not rendered (in the row or the `TabsMenu`), but it keeps its index, so
  `defaultTabIndex` and the indexes passed around by the consumer stay stable. The playthrough
  modal uses it for its "New" pseudo-tab, selected while a new playthrough is being drafted.
- `ariaLabel` — accessible name of the button, for a tab whose `tabName` is an icon or emoji.
- `tooltip` — hover/focus hint passed to `Button`'s `tooltip`; a string one also becomes the
  accessible name when `ariaLabel` is not set.

## Usage

```tsx
import { Tabs } from "@/src/lib/shared/ui/Tabs";

<Tabs
  theme="segmented"
  ariaLabel="Sort reviews"
  contents={sortOptions.map((option) => ({
    tabName: option.label,
    onTabClick: () => setSort(option.value),
  }))}
  defaultTabIndex={sortOptions.findIndex((option) => option.value === sort)}
  isUseDefaultIndex
/>;
```

## Rules and gotchas

- Always pass `ariaLabel` with `theme="segmented"`: the theme sets `role="group"`, and an unnamed
  group is meaningless to a screen reader.
- The segmented look depends on `.tabs__buttons_segmented .tabs__button` out-specifying the base
  rules; a single-class modifier loses and the pills weld into one bar.
- Hide a tab with `isHidden`, never with a `className` that sets `display: none`: the class has to
  out-specify `Button`'s own `display`, which is what forced the doubled-class hacks this prop
  replaced.
- A long `segmented` row (status filters with counts) needs `isWrap`; without it the row is
  `nowrap` and runs past a narrow container.
- Its buttons carry `type="button"`, so it is safe inside a `<form>`.
- A tab with `tabLink` is wrapped in `Link` (which takes the tab's `className`); its button gets
  the same `tabs__button` class and `aria-pressed` as a plain tab.
- No `"use client"`: import it from a client component, never directly into a route file.

## Storybook

`Shared/Tabs`: Default, WithCounts, WithPrefix, Segmented, SegmentedWrap, WithHiddenTab,
IconOnly, WithMobileMenu.
