# SectionTitle

Section heading with the site's accent bar before the text (`bar`), as a filled pill strip
(`pill`), or as the big Pentagra page headline (`display`). Can carry a muted count after the text
and an action on the right. Renders an `h2` by default; the tag is configurable so the visual style
does not dictate the document outline.

## When to use

- The heading of a page or of a `Box` section ("Games", "Upcoming Releases", settings groups).
- `display` — the large headline of a landing block (the home banner, a hub page title).
- `count` — the number of items in the section ("Reviews (37)"), styled like `TabsMenu`'s count.
- `action` — one control that belongs to the heading row ("All", "Edit").
- For a `Box` with a built-in title, prefer `Box`'s own `title` prop.

## API

| Prop                 | Type                           | Default | Purpose                                                        |
| -------------------- | ------------------------------ | ------- | -------------------------------------------------------------- |
| `children`           | `ReactNode`                    | —       | Heading content                                                |
| `as`                 | `"h1" \| "h2" \| "h3" \| "h4"` | `"h2"`  | Rendered tag                                                   |
| `variant`            | `"bar" \| "pill" \| "display"` | `"bar"` | Accent bar, pill strip or Pentagra headline                    |
| `count`              | `number`                       | —       | Muted `(n)` after the text; shown for any number, `0` included |
| `action`             | `ReactNode`                    | —       | Right-aligned slot next to the heading                         |
| `isWithMarginBottom` | `boolean`                      | `false` | Adds `--padding-x5` below                                      |
| `className`          | `string`                       | —       | Extra class on the outermost element                           |

## Usage

```tsx
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";

<SectionTitle as="h1">Games</SectionTitle>

<SectionTitle isWithMarginBottom>Upcoming Releases</SectionTitle>

<SectionTitle
  as="h3"
  count={lists.length}
  action={
    <Button color={ButtonColor.TRANSPARENT} aria-label="All lists">
      All
    </Button>
  }
>
  Lists
</SectionTitle>

<SectionTitle as="h1" variant="display">{hub.name}</SectionTitle>
```

## Rules and gotchas

- **Pick `as` from the page outline, not from the size.** Every page has exactly one `h1`; the
  font size of `bar` is the same for all tags.
- **With `action`, the heading is wrapped in a flex row `div`**, and `className` and
  `isWithMarginBottom` move to that row. The action stays outside the heading element so it is
  not read as part of the title.
- **`count` hides only when `undefined`.** Pass `undefined` rather than `0` when an empty section
  should show no count — unlike `TabCount`, which hides zero.
- `display` uses `--color-text-primary` and has no accent bar; its colour does not follow
  the old `$textSecondary`/`--color-neutral-95` used by the home banner and hub title.
- **Place it inside a `Box`,** like every block on a page over `BGImage`.
- No hooks, so it renders in server components.

## Storybook

`Shared/SectionTitle` — `Bar`, `Pill`, `AsH1`, `WithCount`, `WithZeroCount`, `WithAction`,
`PillWithAction`, `Display`, `DisplayWithCount`, `LongText`, `LongTextWithAction`.
