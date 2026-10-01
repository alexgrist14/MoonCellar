# Highlight

Renders a string with every case-insensitive occurrence of a search query wrapped in `<mark>`.
Without a query it returns the text unchanged.

## When to use

- Search results and filtered lists where the matched part should stand out (search modal user
  rows, `ListCard` name and description).
- Not for rich text or HTML — it only takes a plain string.

## API

| Prop    | Type     | Default | Purpose                                        |
| ------- | -------- | ------- | ---------------------------------------------- |
| `text`  | `string` | —       | Text to render                                 |
| `query` | `string` | —       | Search term; trimmed, empty means no highlight |

## Usage

```tsx
import { Highlight } from "@/src/lib/shared/ui/Highlight";

<span className={styles.name}>
  <Highlight text={list.name} query={query} />
</span>;
```

## Rules and gotchas

- **It returns a fragment, not an element.** Put `className`, truncation (`lineClamp`) and
  layout on the parent.
- The query is escaped before it goes into the `RegExp`, so user input with `(`, `*` or `?` is
  matched literally.
- No hooks, so it renders in server components too.

## Storybook

`Shared/Highlight` — `Default`, `MultipleMatches`, `NoQuery`, `NoMatch`.
