# ActionsMenu

A trigger that opens a short menu of actions and links in a `Popover`. Used in admin tables
(`widgets/admin/GameList`, `widgets/admin/UserList`) to collapse Edit / Open / Delete into one
"Manage" control per row. A custom trigger and link items cover an account menu; a panel item
swaps the popover's content for a small inline form.

## When to use

- A row or card has several secondary actions that do not deserve their own buttons.
- Not for picking a value — that is `Dropdown`. Not for a single action — use `Button`.
- Not for opening the row's page: a row that opens a page is clickable as a whole (see the
  `Table` rules in `apps/web/CLAUDE.md`); the menu holds the other actions.

## API

| Prop                | Type                                             | Default    | Purpose                                                                        |
| ------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| `items`             | `IActionsMenuItem[]`                             | —          | Menu entries, see below.                                                       |
| `label`             | `string`                                         | `"Manage"` | Text of the default trigger button.                                            |
| `isDisabled`        | `boolean`                                        | —          | Disables the default trigger.                                                  |
| `renderTrigger`     | `(props: IActionsMenuTriggerProps) => ReactNode` | —          | Replaces the default trigger; gets `{ ref, isOpen, toggle }`.                  |
| `title`             | `string`                                         | —          | Popover title (shown on the mobile sheet and above the list).                  |
| `width`             | `string`                                         | `"220px"`  | Popover width.                                                                 |
| `isNavigation`      | `boolean`                                        | —          | Renders the list as `<nav>` without `menu`/`menuitem` roles (site navigation). |
| `searchPlaceholder` | `string`                                         | —          | Adds a search field over the items (filters by label) and scrolls a long list. |

Every item has `label`, optional `isDanger` and `isDisabled`, and exactly one of:

- `onClick: () => void` — an action; the menu closes before it runs.
- `href: string`, optional `isExternal` — a `next/link` `Link` with the same item style;
  `isExternal` adds `target="_blank"` and `rel="noopener noreferrer"`. The menu closes on click.
- `panel: IActionsMenuPanel` — `{ title?, width?, render({ back, close }) }`. Choosing the item
  keeps the popover open and replaces the list with `render`'s output, under `panel.title` and at
  `panel.width`; `back()` returns to the list, `close()` closes the menu.

## Usage

```tsx
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";

<ActionsMenu
  items={[
    { label: "Edit", onClick: () => openEditor(game._id) },
    {
      label: "Open on the site",
      onClick: () => window.open(`/games/${game.slug}`, "_blank"),
    },
    { label: "Delete", onClick: () => deleteGame(game._id), isDanger: true },
  ]}
/>;

<ActionsMenu
  isNavigation
  renderTrigger={({ ref, isOpen, toggle }) => (
    <button
      ref={ref}
      type="button"
      aria-label="Account menu"
      aria-expanded={isOpen}
      onClick={toggle}
    >
      <Avatar user={profile} />
    </button>
  )}
  items={[
    { label: "Profile", href: getProfileHref(profile.userName) },
    { label: "Logout", onClick: logout, isDanger: true },
  ]}
/>;

<ActionsMenu
  items={[
    {
      label: "Regenerate…",
      panel: {
        title: "Regenerate",
        width: "360px",
        render: ({ back, close }) => (
          <PromptForm
            initial={prompt}
            onBack={back}
            onSubmit={(value) => {
              close();
              regenerate(value);
            }}
          />
        ),
      },
    },
  ]}
/>;
```

## Rules and gotchas

- **Labels must be unique within `items`.** They are used as React keys.
- **The wrapper stops click propagation.** That is what lets the menu sit inside a clickable
  table row without triggering the row's own `onClick`; do not wrap it in another handler that
  expects the click.
- **The popover renders into `#dropdown-connector` (falls back to `document.body`), and on
  mobile `Popover` switches to a bottom sheet** through `useStatesStore().isMobile`. Inside a
  modal it still stays on top because the connector sits after `ModalsConnector` in `Layout`.
- The menu closes before `onClick` runs, so an action that opens a modal or navigates does not
  leave the menu behind.
- The default trigger already has `type="button"`, so it is safe inside a `<form>`; a custom
  trigger must set it itself, attach `ref` (the popover anchors to it) and call `toggle`.
- **A panel is for a short inline form that belongs to the menu (one field and two buttons).**
  Anything longer, or anything that must survive the menu closing, is a modal opened from an
  `onClick` item. On mobile the panel renders inside the same bottom sheet.
- **Keep a panel's form state in a component rendered by `render`, not in the menu's owner.**
  `render` is looked up from the current `items` on every render (by `label`), so it sees fresh
  props, and a component returned from it mounts each time the panel opens — that is what resets
  the field to its initial value without an `onOpen` hook.
- A disabled link item renders as a disabled button, since an `<a>` cannot be disabled.
- **A long list (a dozen items or more) passes `searchPlaceholder`.** The field filters by
  `label`, case-insensitively, and the items scroll inside `--popover-max-height`; closing the
  menu clears the query. Without it a long list grows the popover past the viewport.

## Storybook

`Shared/ActionsMenu`: `Default`, `CustomLabel`, `WithDisabledItem`, `Disabled`, `WithLinks`,
`CustomTrigger`, `WithPanel`, `WithSearch`.
