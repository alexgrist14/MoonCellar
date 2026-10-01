# ReactionButton

A reaction toggle: icon, optional label, optional count — Like, Helpful, Reply/Discuss.
Pressed state is `aria-pressed`; a read-only variant renders the same content as a plain
`span` for viewers who cannot react (their own review, a profile owner).

## When to use

- Like/helpful/reply actions under comments, reviews and lists, with or without a count.
- Not for generic actions with no pressed state and no count — that is `Button`
  (`ButtonColor.TRANSPARENT` for a quiet one).

## API

| Prop         | Type                 | Default   | Purpose                                                                                |
| ------------ | -------------------- | --------- | -------------------------------------------------------------------------------------- |
| `icon`       | `ReactNode`          | —         | `Svg*` icon (`size="16"`).                                                             |
| `activeIcon` | `ReactNode`          | —         | Icon shown while `isActive` (e.g. `SvgHeartFilled`); otherwise `icon` is filled.       |
| `label`      | `ReactNode`          | —         | Text after the icon ("Helpful", "Reply").                                              |
| `count`      | `number`             | —         | Count after the label, tabular figures. Omitted when `undefined`; `0` is shown.        |
| `isActive`   | `boolean`            | —         | Pressed look and `aria-pressed="true"`.                                                |
| `isReadOnly` | `boolean`            | —         | Renders a non-interactive `span` with the same look (no `onClick`, no `aria-pressed`). |
| `isDisabled` | `boolean`            | —         | Native `disabled`, dimmed (pending request).                                           |
| `onClick`    | `MouseEventHandler`  | —         | Click handler of the button.                                                           |
| `ariaLabel`  | `string`             | —         | Accessible name; required when there is no `label` (icon + count only).                |
| `tooltip`    | `ReactNode`          | —         | Wraps the element in `Tooltip`; a string also becomes the `aria-label` fallback.       |
| `variant`    | `"ghost" \| "boxed"` | `"ghost"` | `ghost`: muted text, hover background (community actions). `boxed`: the `Button` look. |
| `className`  | `string`             | —         | Extra class on the root.                                                               |

## Usage

```tsx
import { ReactionButton } from "@/src/lib/shared/ui/ReactionButton";
import { SvgThumb } from "@/src/lib/shared/ui/svg";

<ReactionButton
  icon={<SvgThumb size="16" />}
  label="Helpful"
  count={review.helpfulCount}
  isActive={review.isHelpful}
  isReadOnly={isOwnProfile}
  onClick={() => onHelpful(review)}
/>;
```

## Rules and gotchas

- The active colour is `--reaction-active-color` (`_components.scss`, `var(--color-accent)`).
  A heart that should turn pink sets it on the button's `className` or any ancestor:
  `--reaction-active-color: var(--favorite-color)`. Do not override `color` directly — in the
  `boxed` variant only the icon takes the active colour.
- In `ghost` the whole button turns the active colour; in `boxed` the text stays primary and
  only the icon changes, as the list like button did.
- Without `activeIcon` the active state fills the icon's paths with `currentColor`
  (`svg path { fill }`), which suits outline icons drawn as single paths.
- The button carries `type="button"`, so it never submits a surrounding form.
- `isReadOnly` drops the element from the tab order; a `tooltip` on it shows on hover only.
  Use `isDisabled` instead when the reason must be reachable from the keyboard.

## Storybook

`Shared/ReactionButton`: `Default`, `Active`, `ReadOnly`, `Disabled`, `IconAndCount`,
`WithoutCount`, `Toggle`, `Boxed`, `BoxedCustomColor`.
