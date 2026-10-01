# EmptyState

The "there is nothing here" block, in four shapes: the centred illustrated placeholder of an empty
list (`default`), a small one for tight spots (`compact`), a dashed hint box that reads as part of
the content (`inline`), and a full status page block — 404, error — (`page`).

## When to use

- `default` — a list, grid or search has loaded and returned nothing ("No lists yet", "Nothing
  found") and the block has room.
- `compact` — the same, inside a popover, drawer, inline feed or narrow admin sidebar, where the
  180px illustration would dominate.
- `inline` — a left-aligned hint inside a section that invites the owner to fill it ("Add
  favourite games — press the heart…", "No lists yet. Create a list"). Pass a small icon (24px).
- `page` — the body of a status page (`NotFoundPage`, `ErrorPage`): `as="h1"`, a description,
  actions, an optional big `eyebrow` (the "404") and an optional figure in `icon`. The page keeps
  its own `Box` with `minHeight: var(--page-height-available)` around it.
- Not as a loading state — render `Loader` while the query is loading.
- `Table` has its own empty state; do not nest this inside a `Table`.

## API

| Prop             | Type                                           | Default     | Purpose                                                             |
| ---------------- | ---------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `title`          | `ReactNode`                                    | —           | Main message                                                        |
| `description`    | `ReactNode`                                    | —           | Secondary text, may hold inline links or buttons; hidden when empty |
| `icon`           | `ReactNode`                                    | —           | Replaces the default illustration; the figure slot of `page`        |
| `isWithoutImage` | `boolean`                                      | `false`     | Hides the illustration or `icon`                                    |
| `action`         | `ReactNode`                                    | —           | Buttons or links under the text, laid out in a wrapping row         |
| `eyebrow`        | `ReactNode`                                    | —           | Large line above the title (status code on a status page)           |
| `variant`        | `"default" \| "compact" \| "inline" \| "page"` | `"default"` | Shape, see above                                                    |
| `as`             | `"p" \| "h1" \| "h2" \| "h3" \| "h4"`          | `"p"`       | Tag of the title; pick it from the document outline                 |
| `isCentered`     | `boolean`                                      | `false`     | Centres the block vertically in a taller flex or grid container     |
| `className`      | `string`                                       | —           | Extra class on the wrapper                                          |

## Usage

```tsx
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";

<EmptyState
  title="No lists found"
  description="Try a different search or clear the filters."
/>

<EmptyState
  variant="inline"
  icon={<SvgListBullet size="24" style={{ color: "var(--color-accent)" }} />}
  title="No lists yet. Collect games around any idea."
  action={<Button color={ButtonColor.ACCENT}>Create a list</Button>}
/>

<Box contentStyle={{ minHeight: "var(--page-height-available)" }}>
  <EmptyState
    variant="page"
    as="h1"
    eyebrow="404"
    icon={<NotFoundFigure />}
    title="Oops! Page not found."
    description="This page drifted off somewhere beyond the dark side of the moon."
    action={<Link href="/">Back to home</Link>}
  />
</Box>
```

## Rules and gotchas

- **The default `SvgEmptyList` illustration appears only in `default` and `compact`.** `inline`
  and `page` show an image only when `icon` is passed — a 180px list illustration inside a hint
  row or next to a 404 is never what you want.
- **`page` lays the figure beside the text and stacks below 960px; without a figure it centres
  everything** (the `ErrorPage` look). It has `flex: 1`, so it fills the `Box` it sits in.
- **There is no separate `StatusState`.** A status page is the same title / text / actions /
  figure structure at a larger scale, so it is a variant here rather than a second component that
  would drift from this one.
- `inline` uses `--color-text-muted` for the message and a dashed `--color-border-primary` frame,
  the profile hint look. It belongs inside the section's `Box`, not around it.
- **Gate it on `isLoading`, never on `isPending`.** A disabled query stays `pending` forever, so a
  loader gated on `isPending` keeps this empty state from ever showing.
- **Centre it with `isCentered`, not with `align-self` in the consumer's module.** The modifier sets
  `align-self: center` plus `margin-block: auto`, so it works as a grid cell (the search modal's
  results row) and as a flex-column child alike; a consumer's own `align-self` competes with the
  component's rules in an order CSS modules do not guarantee.
- It has no hooks, so it can render in a server component.

## Storybook

`Shared/EmptyState` — `Default`, `WithDescription`, `WithAction`, `WithInlineLink`, `CustomIcon`,
`WithoutImage`, `Compact`, `CompactWithoutImage`, `Inline`, `InlineWithAction`, `Page`,
`PageWithFigure`, `LongText`, `Centered`.
