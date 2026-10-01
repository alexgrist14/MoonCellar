# Spoiler

Hides its children behind a blur with a "Show spoilers" button until the reader reveals them.
`isActive={false}` renders the content as is, so a review or comment can always be wrapped and the
flag decides.

## When to use

- User-written content flagged as a spoiler (reviews, comments), and spoiler facts on a
  character profile.
- Not for collapsing long text — that is `ExpandableBlock`.

## API

| Prop        | Type        | Default           | Purpose                              |
| ----------- | ----------- | ----------------- | ------------------------------------ |
| `children`  | `ReactNode` | —                 | Hidden content                       |
| `isActive`  | `boolean`   | `true`            | Whether the content is hidden at all |
| `label`     | `string`    | `"Show spoilers"` | Reveal button text                   |
| `hideLabel` | `string`    | `"Hide spoilers"` | Text of the button that hides again  |
| `className` | `string`    | —                 | Extra class on the wrapper           |

## Usage

```tsx
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";

<Spoiler isActive={review.isSpoiler}>
  <RichText content={review.body} />
</Spoiler>;
```

## Rules and gotchas

- A revealed spoiler shows a "Hide spoilers" button under the content that blurs it again.
- **The hidden content stays in the DOM** (blurred and `inert`), so it is still in the
  server-rendered HTML and indexable, while links inside it are neither focusable nor clickable
  and screen readers skip it until it is revealed.
- **The reveal and hide controls stay native `<button>`s, not `Button`.** They are absolutely positioned attention-toned pills centred over the blurred content, and no `ButtonColor` has the attention outline; overriding a theme from outside would fight `Button`'s own border and background.

## Storybook

`Shared/Spoiler` — `Hidden`, `Inactive`, `CustomLabel`.
