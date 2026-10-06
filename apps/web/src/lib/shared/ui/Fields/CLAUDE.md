# Fields

A kit of labelled, controlled form fields for admin and request forms (game edit, character
editor, game requests, AI drafts). Every field is a `label` plus one shared control, takes a plain
`value`/`onChange` pair, and shares `fields.module.scss`. `TextField` and `TextareaField` also
accept a react-hook-form `register(...)` spread.

## When to use

- Editing a record field by field where each value is set through `onChange` (often from a
  react-hook-form `Controller` or a draft object).
- For a single input outside such a form, use the underlying control directly (`Input`,
  `Textarea`, `Dropdown`, `DatePicker`, `ToggleSwitch`).

## API

All fields take `label: string` and `disabled?: boolean`; `error?: string` renders a message under
the control where listed (`TextField` and `TextareaField` also take a react-hook-form `FieldError`).

| Export               | Value type                  | Other props                                                                                       | Notes                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Field`              | —                           | `children`, `error`                                                                               | Label above any control; for one the kit has no field for (a `Dropdown` driven by index, an ISO `DatePicker`)                                                                                                                                                                                    |
| `TextField`          | `string`                    | `error`, `isLabelHidden`, `isFlush`, `action`, `ref`, every `Input` prop                          | `Input`; label tied by `htmlFor`/`useId`; `name` switches `onChange` to the native event (see below); `action` sits beside the input at its height (a "Parse" button), `isFlush` drops the bottom margin for a parent that spaces fields with `gap`                                              |
| `NumberField`        | `number \| null`            | `error`                                                                                           | Empty input emits `null`                                                                                                                                                                                                                                                                         |
| `TextareaField`      | `string`                    | `error`, `ref`, every `Textarea` prop                                                             | `Textarea`; same two modes as `TextField`                                                                                                                                                                                                                                                        |
| `DateField`          | `number \| null` (unix sec) | `error`, `isLabelHidden`                                                                          | `DatePicker`; emits `undefined` when cleared                                                                                                                                                                                                                                                     |
| `ToggleField`        | `boolean`                   | `hint`, `labelPosition: "start" \| "end"`                                                         | `ToggleSwitch` with OFF/ON; label above unless `labelPosition` puts it beside the switch                                                                                                                                                                                                         |
| `EnumField`          | `string`                    | `options: string[]`, `error`, `placeholder`                                                       | Searchable `Dropdown` with reset; keeps an unknown current value selectable; `placeholder` replaces "Select <label>" (e.g. the automatic value)                                                                                                                                                                                                                      |
| `EnumListField`      | `string[]`                  | `options: string[]`                                                                               | Multi `Dropdown`, header reads "Selected N"                                                                                                                                                                                                                                                      |
| `StringListField`    | `string[]`                  | `action?: ReactNode`, `isAddDisabled?: boolean`                                                   | Chips plus input; Enter or "Add" appends a trimmed value                                                                                                                                                                                                                                         |
| `NumberListField`    | `number[]`                  | —                                                                                                 | Chips plus number input                                                                                                                                                                                                                                                                          |
| `ObjectListField`    | `Record<string, unknown>[]` | `fields: IObjectFieldDescriptor[]`, `isLabelHidden`                                               | Rows of text/number/boolean/date cells, add/remove rows                                                                                                                                                                                                                                          |
| `ImagePickerField`   | `string \| null` (URL)      | `options: IImagePickerOption[]`, `autoCaption`, `isUnoptimized`                                   | Radio grid of image tiles plus "Automatic" (`null`)                                                                                                                                                                                                                                              |
| `UploadButton`       | —                           | `onFile(file)`, `tooltip`, `label`, `fileName`, `className`, `isFullWidth`, `isFullWidthOnMobile` | Hidden `accept="image/*"` input behind a `Button`; shows the picked name                                                                                                                                                                                                                         |
| `CollapsibleSection` | —                           | `title`, `note`, `isDefaultOpen`, `isStatic`, `hasError`, `isKeptMounted`, `children`             | Toggleable group; opens itself when `hasError` turns true. `isStatic`: a plain titled group, always open, no toggle. `isKeptMounted`: a collapsed body stays in the DOM (`hidden`) instead of unmounting, for content whose effects must run while closed (the Steam sign-in return in Settings) |

Helpers exported from `DateField`: `unixToDateInput`, `dateInputToUnix`,
`deriveReleaseDateFields` (fills `human`/`month`/`year` from a unix date, used as a descriptor's
`derive`).

## Usage

```tsx
import { StringListField, TextField } from "@/src/lib/shared/ui/Fields";

<TextField label="Name" value={draft.name} onChange={set("name")} />
<StringListField
  label="Alternative names"
  value={draft.alternative_names}
  onChange={set("alternative_names")}
/>
```

`TextField` with `register`, as the playthrough modal's game time does:

```tsx
<TextField
  label="Game time (hours)"
  type="text"
  inputMode="decimal"
  placeholder="0"
  {...register("time", {
    setValueAs: (value) =>
      value === "" || value == null ? undefined : Number(value),
  })}
  value={watch("time") || ""}
  error={errors.time}
/>
```

The spread brings `name`, `ref`, `onChange` and `onBlur`, so the field registers and
`formState.isValid` keeps updating; `value` stays optional and may be dropped to leave the input
uncontrolled.

## Rules and gotchas

- **`TextField`/`TextareaField` pick their `onChange` signature from `name`.** Without `name`
  (the value mode every existing caller uses) `onChange` receives the string and `value` defaults
  to `""`, so the input is always controlled. With `name` — which `register` always supplies —
  `onChange` is the native `ChangeEventHandler` and `value` is passed through untouched. The
  props are a discriminated union, so a value-style `onChange` next to `name` fails the type
  check instead of crashing react-hook-form at runtime (it reads `event.target.name`).
- Every other `Input` prop (`placeholder`, `className` on the `<input>`, `containerClassname`,
  `onKeyDown`, `onBlur`, `inputMode`, `autoFocus`, `aria-*`, …) passes straight through. `id`
  defaults to a `useId` value shared with the label's `htmlFor`; with `isLabelHidden` the label
  becomes the input's `aria-label` instead.
- **`UploadButton`'s `fileName` is controlled when it is not `undefined`.** Pass `null` to show
  nothing — `fileName={file ? file.name : null}`, not `file?.name`, which falls back to the
  internally remembered pick and keeps the old name on screen after a save. Without the prop the
  button shows the last picked name itself. The hidden input is cleared after every pick, so
  choosing the same file again still fires `onFile`.
- `UploadButton`'s `className` goes on its row; `isFullWidth` stacks the row and stretches the
  button to it (the file name goes under the button). `isFullWidthOnMobile` does the same below
  `$screenMd` through a media query inside the component — use it instead of switching
  `isFullWidth` from the `isMobile` store, which only applies after hydration and makes the
  button jump.
- **Inside react-hook-form, wire each field through `Controller` or a `register` spread.** A field
  driven only by `setValue` never registers, so `formState.isValid` stays at its initial value and a
  `disabled: !isValid` Save button stays locked.
- **Validate the pruned values, not the raw form.** A `Controller` on a nested path creates the
  key with `undefined` (`igdb: {}`), which fails required-field checks.
- **`DateField` and `ObjectListField` dates are unix seconds in UTC;** the `DatePicker` under them
  speaks ISO `yyyy-mm-dd`. Convert only through the exported helpers.
- **`EnumField`/`EnumListField` pass `isThroughPortal`,** so their lists render into
  `#dropdown-connector` and are safe inside modals; that element must exist on the page.
- **All buttons here set `type="button"`;** keep it that way when extending, or they submit the
  surrounding form.
- `ObjectListField` keys its rows with ids from a per-instance counter, not with data. Existing
  rows keep their key; an outside change to the row count only appends keys for new rows or
  drops keys from the end, so an outside removal of a middle row shifts keys onto its
  neighbours.
- `CollapsibleSection`'s toggle shows `SvgChevron`, rotated `-90deg` while closed, and carries
  `aria-expanded`. With `isStatic` the head is a plain `div` and the body (note included) always
  renders — use it for a form group heading that should not collapse.
- `ObjectListField`'s row remove is an icon-only transparent `Button` tinted negative;
  `StringListField`'s values are outlined `Chip`s with `onRemove`, and the module only adds the
  "just added" flash (`chip_added`).
- `ImagePickerField` renders option URLs through `next/image`; pass `isUnoptimized` for hosts not
  in `images.remotePatterns`.

## Storybook

`Shared/Fields` — `TextFields`, `WithErrors`, `Disabled`, `ListFields`, `ObjectList`,
`ImagePicker`, `ImagePickerEmpty`, `Collapsible`, `CollapsibleStatic`, `Upload`,
`UploadResettable`, `Registered`, `ToggleWithHint`, `AnyControl`, `EnumWithPlaceholder`.
