# TabsMenu

Mobile replacement for a tab row: a button showing the active tab (with a burger icon and an
optional count) that opens a `Popover` listing all tabs. Also exports `TabCount`, the "(N)"
suffix used next to tab names.

## When to use

- You normally do not render it yourself: `Tabs` renders it when given `mobileMenuTitle` and
  switches between the button row and this menu with a media query.
- Render it directly only for a custom tab bar that needs the same collapsed menu.

## API

`TabsMenu`:

| Prop          | Type                                                                                                                        | Default | Purpose                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `tabs`        | `{ tabName: string; prefix?: ReactNode; count?: number; ariaLabel?: string; isHidden?: boolean; onTabClick: () => void }[]` | —       | Tabs in order; `isHidden` skips the menu item but keeps its index, `ariaLabel` names it |
| `activeIndex` | `number`                                                                                                                    | —       | Index shown on the trigger                                                              |
| `title`       | `string`                                                                                                                    | —       | Popover title                                                                           |
| `className`   | `string`                                                                                                                    | —       | Class on the wrapper                                                                    |

`TabCount`: `count?: number` — renders `(count)`, or nothing for `0`/`undefined`.

## Usage

```tsx
import { Tabs } from "@/src/lib/shared/ui/Tabs";

<Tabs contents={tabs} mobileMenuTitle="Sections" />;
```

```tsx
import { TabsMenu } from "@/src/lib/shared/ui/TabsMenu";

<TabsMenu
  title="Sections"
  activeIndex={index}
  tabs={sections.map((name, i) => ({
    tabName: name,
    onTabClick: () => setIndex(i),
  }))}
/>;
```

## Rules and gotchas

- **It is always visible on its own;** hiding it on desktop is the caller's CSS (`Tabs` does it
  with `.tabs__menu`).
- **The menu renders into `#dropdown-connector`** through `Popover` (falling back to `body`), and
  closes on an outside click.
- **`tabName` is the React key of the menu items,** so tab names must be unique.
- Unlike most shared UI it carries `"use client"`.

## Storybook

`Shared/TabsMenu` — `Default`, `WithCounts`, `Open`, `WithHiddenTab`.
