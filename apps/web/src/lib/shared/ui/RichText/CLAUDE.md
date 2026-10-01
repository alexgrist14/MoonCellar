# RichText

Renders user-written HTML (reviews, playthrough comments, discussion comments) through
`Interweave`, which turns the markup into React elements and drops `script`/`iframe`, and styles
it with the shared `richText` mixin. Renders nothing when `content` is empty.

## When to use

- Every place that shows user-written rich text. Never use `dangerouslySetInnerHTML` for it.
- Editing rich text is `RichEditor`; its content area uses the same mixin, so the editor shows
  exactly what `RichText` will render.

## API

| Prop        | Type     | Default | Purpose                                      |
| ----------- | -------- | ------- | -------------------------------------------- |
| `content`   | `string` | –       | HTML string; empty or missing renders `null` |
| `className` | `string` | –       | Extra class on the wrapper                   |

## Usage

```tsx
import { RichText } from "@/src/lib/shared/ui/RichText";

<RichText content={review.text} className={styles.entry__text} />;
```

## Rules and gotchas

- `Interweave` is a second line of defence; the API's `sanitizeRichText` is the first. Do not
  loosen either on the assumption that the other covers it.
- The look lives once in the `richText` mixin (`_mixins.scss`). Do not restyle paragraphs,
  images or spacing from a consumer; block spacing is `--rich-text-gap`, and images are capped
  at `min(100%, var(--rich-editor-image-width))`.
- A `font-size` on `className` reaches paragraphs only because the mixin sets
  `p { font-size: inherit }`; `root.scss` has a bare `p { font-size: 14px }` that would win
  otherwise. Keep that line if the mixin is edited.
- Never collapse line breaks with `br + br`: the combinator ignores text nodes and hides every
  `br` but the first.

## Storybook

`Shared/RichText`: Paragraphs, Formatting, WithImage, Empty.
