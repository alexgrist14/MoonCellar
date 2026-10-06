# Button

The site's button. Renders a native `<button>` — or, with `href`, a `next/link` `Link` with the
same classes — with one of the `ButtonColor` themes, an optional compact size, an optional
loading state and an optional `Tooltip`. The folder also exports `ButtonGroup`
(`Button/ButtonGroup`), a wrapping row of buttons built from plain data.

## When to use

- Any clickable action, including icon-only actions (pass the `Svg*` component as the child).
- A row of mutually exclusive switches is `Tabs`, not a row of `Button`s (`theme="segmented"`
  gives the pill look backed by `ButtonColor.SEGMENTED`).
- A navigation target is `<Button href="…">` (link mode), never `<Link><Button /></Link>` (an
  interactive element inside a link is invalid HTML and is announced twice) and never an
  `onClick` that calls the router.
- A pending submit is `isLoading`, not a hand-placed `Loader` plus a hidden label span.
- A quiet inline action in a metadata row (Reply, Like with a count, Report) is
  `ButtonColor.GHOST`, with `active` for the toggled-on state, and `isAccentText` for one that
  opens more content rather than toggling ("3 replies", "Show more replies").

## API

`Button` accepts `children`, `disabled`, `type`, `className`, `onClick`, `form`, `style`, `ref`,
`aria-label`, `aria-pressed`, `aria-expanded` from the native button, plus:

| Prop           | Type                              | Default               | Purpose                                                                                                 |
| -------------- | --------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `color`        | `ButtonColor` or its string value | `ButtonColor.DEFAULT` | Theme: `default`, `accent`, `red`, `green`, `greenBorder`, `transparent`, `fancy`, `segmented`, `ghost` |
| `active`       | `boolean`                         | –                     | Pressed/selected look (adds `button_active` and the color's active class)                               |
| `tooltip`      | `string \| ReactNode`             | –                     | Wraps the button in `Tooltip`; a string also becomes the `aria-label`                                   |
| `tooltipAlign` | `"left" \| "right" \| "center"`   | `"center"`            | Tooltip alignment, mapped to `start`/`end`/`center`                                                     |
| `compact`      | `boolean`                         | –                     | Smaller padding (`x05`/`x1`)                                                                            |
| `hidden`       | `boolean`                         | –                     | Hides the button through a class, keeping it mounted                                                    |
| `isOnlyIcon`   | `boolean`                         | –                     | Forces a square (`aspect-ratio: 1`) button                                                              |
| `isAccentText` | `boolean`                         | –                     | Accent text that stays accent on hover, for a ghost/transparent action that is not a toggle             |
| `isLoading`    | `boolean`                         | –                     | Disables the button, sets `aria-busy`, shows a pulse `Loader` over the hidden label (width kept)        |
| `href`         | `LinkProps["href"]`               | –                     | Link mode: renders a `next/link` `Link` with the same classes instead of a `<button>`                   |
| `target`       | `HTMLAttributeAnchorTarget`       | –                     | Link mode only                                                                                          |
| `rel`          | `string`                          | –                     | Link mode only                                                                                          |
| `prefetch`     | `LinkProps["prefetch"]`           | –                     | Link mode only, passed to `Link`                                                                        |

The active colour of `default`, `segmented` and `ghost` reads `--button-active-color`, falling
back to the theme's own (`--color-accent`, `--color-text-primary`, `--color-accent`). Set it on
the button through a class in the consumer's module (`.mastered { --button-active-color:
var(--game-mastered-color); }`) to give one toggle a domain colour; it is the only property a
consumer sets on a `Button`, the way `ReactionButton` takes `--reaction-active-color`.

`ButtonGroup` props: `buttons: IButtonGroupItem[]` (every `Button` prop plus `title` and an
optional `link`, which is an alias of `href`), `wrapperStyle`, `wrapperClassName`. Items with a
`link`/`href` render through link mode, so each item is a single element — a `<button>` or an
`<a>` carrying the button classes.

## Usage

```tsx
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { SvgClose } from "@/src/lib/shared/ui/svg";

<Button type="button" color={ButtonColor.ACCENT} onClick={save}>
  Save
</Button>

<Button type="button" color={ButtonColor.TRANSPARENT} tooltip="Close" onClick={onClose}>
  <SvgClose size="16" />
</Button>

<Button href={`/games/${slug}`} compact>Open</Button>
<Button href={igdbUrl} target="_blank">Open on IGDB</Button>

<Button type="submit" color={ButtonColor.ACCENT} isLoading={isPending}>
  Sign in
</Button>

<Button type="button" color={ButtonColor.GHOST} active={isLiked} onClick={toggleLike}>
  <SvgThumb size="16" />
  {likes}
</Button>
```

```tsx
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";

<ButtonGroup
  buttons={[
    { title: "Edit", onClick: edit },
    { title: "Open on IGDB", link: igdbUrl, target: "_blank" },
  ]}
/>;
```

## Rules and gotchas

- Pass `type="button"` to every button that is not a form's submit button. `Button` sets no
  `type`, so inside a `<form>` it submits the form (the request page's tabs did exactly that).
- Do not pass a padding override to an icon-only button. A single component-element child (or a
  single character) is detected and gets `button_icon` with equal padding.
- Pass `isOnlyIcon` only when the button is sized by its content. Squareness is never detected,
  because a button stretched to its container's width with `aspect-ratio: 1` grows as tall as it
  is wide.
- Any padding override keeps inline padding at twice the block padding on the same scale; a 1:3
  button reads as a different control next to its neighbours.
- Every button is `--radius-button`, wherever it sits, with no exceptions.
- **A consumer's `className` on `Button` is for layout only** — margin, grid placement, width or
  flex sizing, `align-self`, `justify-content` of its content. Colour, radius, padding, font and
  gap come from the component; a missing look is a new prop here, not a doubled selector in the
  consumer.
- Icon and label are spaced by the button's own `gap: var(--gap-x2)`; never restate it.
- Give an icon-only button an accessible name: `tooltip` as a string or `aria-label`.
- **Icon plus text goes in as siblings, never wrapped in a fragment.** A single child whose type
  is not a string counts as an icon, and a `<>…</>` is such a child — it gets `button_icon`'s
  equal padding. `<Svg />{count}` is an array and is measured as text.
- **Link mode keeps the button's look, not its semantics.** `disabled` and `isLoading` cannot
  disable an `<a>`, so the link gets `aria-disabled`, `tabIndex={-1}` and `button_disabled`
  (`pointer-events: none`). `type` and `form` are ignored. `onClick` still runs before
  navigation, so closing a menu from it works. A parent stylesheet that targets the item as
  `button` must also target `a` (`Header` does, for the Gauntlet item).
- **`isLoading` shows the loader in `currentColor`,** so it stays visible on the accent and green
  themes, and keeps full opacity while disabled. The label stays in the DOM (`visibility:
hidden`), which is what keeps the width.
- `GHOST` has its own padding (`x05`/`x1`), 13px/20px type and the shared `--radius-button`; `active` turns the
  text and any filled icon path accent (or `--button-active-color`). It skips the global hover dimming like `transparent`.

## Storybook

`Shared/Button`: Default, Accent, Danger, Compact, Disabled, IconOnly, Ghost, GhostActive,
GhostAccentText, SegmentedActiveColor, IconAndLabel, Loading, LoadingCompact, AsLink, AsExternalLink, AsLinkActive, AsLinkIconOnly, AsLinkDisabled.
