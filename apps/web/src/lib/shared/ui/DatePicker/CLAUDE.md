# DatePicker

The site's date field: a clickable field showing `dd.mm.yyyy` and a month calendar popover with
Clear and Today. It replaces the native date input everywhere.

## When to use

- Every date field (playthrough date, admin release dates via `Fields/DateField`).
- Never render `<input type="date">`: the browser paints a dark icon and a white popup that
  ignore the dark theme.

## API

| Prop          | Type                      | Default  | Purpose                                                    |
| ------------- | ------------------------- | -------- | ---------------------------------------------------------- |
| `value`       | `string`                  | —        | ISO `yyyy-mm-dd` (longer ISO strings are cut to the date). |
| `onChange`    | `(value: string) => void` | —        | Receives ISO `yyyy-mm-dd`, or `""` on Clear.               |
| `placeholder` | `string`                  | `"Date"` | Shown when empty; also the field's `aria-label`.           |
| `className`   | `string`                  | —        | Class on the wrapper.                                      |
| `isDisabled`  | `boolean`                 | —        | Blocks opening the popover.                                |

## Usage

```tsx
import { DatePicker } from "@/src/lib/shared/ui/DatePicker";

<DatePicker
  value={watch("date") || ""}
  onChange={(value) => setValue("date", value, { shouldValidate: true })}
/>;
```

## Rules and gotchas

- The field's radius is `--radius-control`, like `Input` and `Dropdown`, so they line up in one
  form.
- **The popover is portalled into `#dropdown-connector`** (falls back to `document.body`), so a
  field inside a modal or a clipped panel is never cut off. It flips above the field when there
  is no room below and follows scroll and resize.
- **Parse ISO dates by hand, never `new Date("2026-09-20")`.** That form is UTC midnight and
  shows the previous day in negative-offset timezones; the component builds
  `new Date(y, m - 1, d)` for this reason — keep it when converting values around it.
- **Driven by `setValue` in react-hook-form, pass `shouldValidate: true`** (or wire it through a
  `Controller`), otherwise `formState.isValid` never updates and a Save button gated on it stays
  locked.
- All internal buttons carry `type="button"`, so it is safe inside a `<form>`.
- The month arrows are compact icon-only `Button`s and Clear/Today are compact transparent
  `Button`s; only the day cells stay native buttons, because their size, today ring and
  selected fill are the calendar grid itself. The popover keeps its own positioning rather
  than `Popover`.
- Weeks start on Monday; month names are `en-US`.

## Storybook

`Shared/DatePicker`: `Empty`, `WithValue`, `Disabled`.
