# Chip

A small rounded label that renders as a `span`, a Next `Link`, or an external `<a>`, depending
on `href` and `isExternal`. With `onRemove` it also carries a red × remove button. Used for keyword/genre/theme tags on the game page, the external link
list, and the selected items in the request form.

## When to use

- Short tags or tag-like links (genres, keywords, external hosts, picked entries).
- Not for removable filter pills — use `AppliedFilters`; for a list of removable entries use
  `RemovableChips`, which is built on `Chip`'s `onRemove`.
- Not for actions — use `Button`; a `Chip` without `href` is a plain `span` with no click handling.

## API

| Prop          | Type                     | Default               | Purpose                                                                          |
| ------------- | ------------------------ | --------------------- | -------------------------------------------------------------------------------- |
| `children`    | `ReactNode`              | —                     | Content of the chip.                                                             |
| `href`        | `string`                 | —                     | Turns the chip into a link. Without it a `span` is rendered.                     |
| `isExternal`  | `boolean`                | —                     | With `href`, renders `<a target="_blank" rel="noreferrer">`.                     |
| `isNoFollow`  | `boolean`                | —                     | With `isExternal`, adds `nofollow` — use it for URLs users submitted (requests). |
| `variant`     | `"filled" \| "outlined"` | `"filled"`            | Filled tertiary background, or bordered with a muted text.                       |
| `className`   | `string`                 | —                     | Extra class on the root element.                                                 |
| `title`       | `string`                 | —                     | Native `title` tooltip (e.g. the full URL).                                      |
| `onRemove`    | `() => void`             | —                     | Adds a remove button (`SvgClose`) after the content.                             |
| `removeLabel` | `string`                 | `"Remove <children>"` | `aria-label` of the remove button; pass it when `children` is not a string.      |
| `isDisabled`  | `boolean`                | —                     | Disables the remove button.                                                      |

## Usage

```tsx
import { Chip } from "@/src/lib/shared/ui/Chip";

<Chip href={`/games?genres=${encodeURIComponent(genre)}`}>{genre}</Chip>

<Chip href={link.url} title={link.url} variant="outlined" isExternal>
  {link.host}
</Chip>
```

## Rules and gotchas

- Pass `isExternal` for any URL outside the site; without it the URL goes through Next `Link`,
  which prefetches and client-navigates and is wrong for a third-party origin.
- Long text wraps anywhere (`overflow-wrap: anywhere`) and the chip is capped at `max-width:
100%`, so it never needs truncation, but a chip row should still `flex-wrap`.
- With `onRemove` the root is always a `span` and the link (when `href` is set) sits inside it,
  because a button cannot be nested in an `<a>`. The remove button is `type="button"`.
- It has no `"use client"` and no hooks, so it can render inside a server component.

## Storybook

`Shared/Chip` — `Filled`, `Outlined`, `InternalLink`, `ExternalLink`, `LongText`, `Row`, `Removable`,
`RemovableLink`, `RemovableDisabled`.
