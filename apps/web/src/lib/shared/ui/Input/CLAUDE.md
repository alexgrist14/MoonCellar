# Input

The site's single-line text field: a native `<input>` inside a bordered container that turns
accent on focus and red on error, with the error message printed below. It forwards its ref to
the `<input>`, so it works with react-hook-form's `register`.

## When to use

- Any single-line text, search, password, email or number field (auth modal, pagination jump,
  `SearchPicker`, `SaveForm`).
- Not for multi-line text — use `Textarea`; for formatted text use `RichEditor`.
- Not for dates — never `type="date"`; use `DatePicker`.
- Not for picking from a list — use `Dropdown`.

## API

| Prop                 | Type                    | Default | Purpose                                                                        |
| -------------------- | ----------------------- | ------- | ------------------------------------------------------------------------------ |
| `error`              | `FieldError \| string`  | —       | A react-hook-form error or a plain message; turns the border red, shown below. |
| `containerStyles`    | `CSSProperties`         | —       | Inline style on the bordered container.                                        |
| `containerClassname` | `string`                | —       | Class on the bordered container.                                               |
| `className`          | `string`                | —       | Class on the `<input>` itself.                                                 |
| `ref`                | `Ref<HTMLInputElement>` | —       | Forwarded to the `<input>`.                                                    |

Every other native `<input>` attribute (`aria-*`, `onFocus`, `onPaste`, `inputMode`,
`maxLength`, `min`, `max`, `step`, `pattern`, `style`, …) is passed through to the `<input>`.

## Usage

```tsx
import { Input } from "@/src/lib/shared/ui/Input";

<Input
  {...register("email")}
  type="email"
  placeholder="Email"
  autoComplete="email"
  error={errors.email}
/>;
```

## Rules and gotchas

- Only the message matters: a `FieldError` without `message`, or an empty string, shows neither
  the red border nor text. Pass a string straight from local state — never wrap it into
  `{ type, message }`.
- The props type is exported as `InputProps`; wrappers such as `TextField` extend it.
- `style` goes to the `<input>`, not the container; size or space the field with
  `containerStyles`/`containerClassname`, since the container draws the border and padding.
- The wrapper is `width: 100%`; constrain the parent, not the input.
- Placeholder text is styled with `--color-gray` and long values are truncated with an ellipsis.
- There is no label element. Pair it with a visible label, give it an `id` referenced by a
  `<label htmlFor>`, or pass `aria-label`.
- The container's radius is `--radius-x4`, one step below the `Box` it normally sits in.

## Storybook

`Shared/Input` — `Default`, `WithValue`, `Password`, `WithError`, `WithStringError`, `Disabled`,
`Controlled`, `Numeric`.
