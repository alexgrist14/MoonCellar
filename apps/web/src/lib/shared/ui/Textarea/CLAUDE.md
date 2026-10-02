# Textarea

The site's multi-line text field. It grows with its content (through a hidden mirror element),
has an optional drag handle for manual resizing, and shows a react-hook-form `FieldError` under
the field.

## When to use

- Plain multi-line text: list descriptions, profile bio, admin text fields
  (`Fields/TextareaField`).
- Formatted text (reviews, comments with images) uses `RichEditor`; a single line uses `Input`.

## API

| Prop                                                                                                             | Type                                      | Default | Purpose                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------- |
| `value` / `defaultValue`                                                                                         | `string`                                  | —       | Controlled or uncontrolled text.                            |
| `onChange`                                                                                                       | `ChangeEventHandler<HTMLTextAreaElement>` | —       | Change handler.                                             |
| `rows`                                                                                                           | `number`                                  | `1`     | Minimum height in lines.                                    |
| `resize`                                                                                                         | `boolean`                                 | `true`  | Shows the resize handle.                                    |
| `isDisableAutoResize`                                                                                            | `boolean`                                 | —       | Turns off growing with content.                             |
| `error`                                                                                                          | `FieldError`                              | —       | Red border and the message below the field.                 |
| `clearErrors`                                                                                                    | `any`                                     | —       | react-hook-form `clearErrors`; called with `name` on click. |
| `className`                                                                                                      | `string`                                  | —       | Class on the wrapper.                                       |
| `classNameField`                                                                                                 | `string`                                  | —       | Class on the `textarea` (and the mirror).                   |
| `style`                                                                                                          | `CSSProperties`                           | —       | Inline style on the `textarea` (and the mirror).            |
| `ref`                                                                                                            | `Ref<HTMLTextAreaElement>`                | —       | Forwarded to the `textarea`.                                |
| `children`                                                                                                       | `ReactNode`                               | —       | Rendered after the field, inside the wrapper.               |
| `name`, `id`, `placeholder`, `disabled`, `readOnly`, `autoComplete`, `onFocus`, `onBlur`, `onClick`, `onKeyDown` | native                                    | —       | Passed to the `textarea`.                                   |

## Usage

```tsx
import { Textarea } from "@/src/lib/shared/ui/Textarea";

<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <Textarea
      {...field}
      rows={3}
      placeholder="What ties these games together?"
      error={errors.description}
    />
  )}
/>;
```

## Rules and gotchas

- **Font and padding overrides go through `classNameField` or `style`, never a selector on the
  `textarea` alone.** Both are applied to the hidden mirror too; a mirror with a different font
  measures the wrong height and the field grows too much or too little.
- **Auto-growth stops at 40% of the viewport, a manual drag at 80%;** past that the field
  scrolls. Escape or a double-click on the handle drops the manual height.
- A consumer's `onClick` runs after the built-in `clearErrors` call; both fire.
- The field's radius is `--radius-control` (same as `Input`), the handle's `--radius-x3`.
- **`clearErrors` needs `name`;** without it the click does nothing.
- Wire it to react-hook-form through `Controller` or `register`, not `setValue` alone, or
  `formState.isValid` never recomputes.
- The handle is keyboard-accessible (`role="separator"`, Arrow Up/Down by 24px).
- No `"use client"`: import it from a client component.

## Storybook

`Shared/Textarea`: `Default`, `LongText`, `WithError`, `WithoutResizeHandle`, `FixedHeight`,
`Disabled`.
