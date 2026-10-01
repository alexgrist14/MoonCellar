# Breadcrumbs

Breadcrumb trail rendered as a `<nav aria-label="Breadcrumb">`. Every item but the last is a
`next/link`; the last one is plain text with `aria-current="page"`, and the second-to-last link
gets a back chevron so the trail doubles as a "go up one level" control.

## When to use

- At the top of a page's heading `Box`, above the `SectionTitle`/`h1` (games catalogue, hub
  pages, custom lists, profile, admin edit pages).
- Not for in-page navigation between sections — use `Tabs`.

## API

| Prop        | Type            | Default | Purpose                                            |
| ----------- | --------------- | ------- | -------------------------------------------------- |
| `items`     | `IBreadcrumb[]` | —       | Trail from root to current page (`{ name, href }`) |
| `className` | `string`        | —       | Extra class on the `nav`                           |

`IBreadcrumb` is exported from the slice.

## Usage

```tsx
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";

<Breadcrumbs
  items={[
    { name: "Home", href: "/" },
    { name: "Games", href: "/games" },
  ]}
/>;
```

## Rules and gotchas

- **`href` is the React key, so every item needs a distinct `href`.** Two items with the same
  `href` produce a duplicate-key warning and can render the wrong text after an update.
- **The last item is never a link**, even though it still needs an `href` for the key; pass the
  current page's own URL.
- **Place it inside a `Box`.** Like every content block it must not sit directly on the page
  background (`BGImage` makes bare text unreadable).
- It has no hooks and no `"use client"`, so it can render in a server component.

## Storybook

`Shared/Breadcrumbs` — `TwoLevels`, `Deep`, `LongNames`.
