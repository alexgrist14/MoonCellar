# Errors

A compact list of form errors, each line rendered as a red bold title followed by its
description. Used at the top of the playthrough modal's form to summarise react-hook-form errors.

## When to use

- Several validation errors summarised in one place, typically mapped from `formState.errors`.
- Not for a single field's error — `Input` (and the other fields) show their own message through
  the `error` prop.
- Not for request failures — every failed API request already shows a toast from the `agent`
  interceptor.

## API

| Prop     | Type              | Default | Purpose                                                        |
| -------- | ----------------- | ------- | -------------------------------------------------------------- |
| `errors` | `IErrorMessage[]` | —       | Lines to show; `{ title?, description? }`, strings or numbers. |

`IErrorMessage` lives in `@/src/lib/shared/types/error.types`.

## Usage

```tsx
import { Errors } from "@/src/lib/shared/ui/Errors";

<Errors
  errors={Object.keys(errors).map((key) => ({
    title: key,
    description: errors[key as keyof typeof errors]?.message,
  }))}
/>;
```

## Rules and gotchas

- It returns `null` for an empty array, so it can be rendered unconditionally.
- Lines are keyed by index; the list is meant to be replaced as a whole on every render, not
  edited item by item.
- The output is plain text with no `role="alert"`; a screen reader is not told when errors
  appear, so pair it with field-level `aria-invalid`/messages when accessibility matters.

## Storybook

`Shared/Errors` — `Single`, `Multiple`, `Empty`.
