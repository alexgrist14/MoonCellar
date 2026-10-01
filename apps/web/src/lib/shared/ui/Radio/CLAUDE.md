# Radio

A styled native `<input type="radio">`. It has no label of its own; the caller wraps it in a
`<label>` together with the option text.

## When to use

- One option in a list of mutually exclusive options inside a menu or form.
- A visible row of exclusive switches is `Tabs` (`theme="segmented"` for the compact pill
  look). A two-state on/off is `ToggleSwitch` or `Checkbox`.

## API

| Prop        | Type                                   | Default | Purpose                                          |
| ----------- | -------------------------------------- | ------- | ------------------------------------------------ |
| `name`      | `string`                               | —       | Radio group name; options of one group share it. |
| `value`     | `string`                               | —       | Native value, submitted with the group `name`.   |
| `checked`   | `boolean`                              | —       | Controlled checked state.                        |
| `onChange`  | `ChangeEventHandler<HTMLInputElement>` | —       | Fires when this option is selected.              |
| `disabled`  | `boolean`                              | —       | Native disabled.                                 |
| `required`  | `boolean`                              | —       | Native required.                                 |
| `id`        | `string`                               | —       | For an external `<label htmlFor>`.               |
| `className` | `string`                               | —       | Extra class on the input.                        |

## Usage

```tsx
import { Radio } from "@/src/lib/shared/ui/Radio";

const groupName = useId();

{
  options.map((option) => (
    <label key={option}>
      {option}
      <Radio
        name={groupName}
        value={option}
        checked={selected === option}
        onChange={() => setSelected(option)}
      />
    </label>
  ));
}
```

## Rules and gotchas

- Always wrap it in a `<label>` (or point a `<label htmlFor>` at its `id`); otherwise the
  radio has no accessible name and only the small circle is clickable.
- Use a group `name` unique on the page (derive it from `useId`): two components rendering the
  same hardcoded `name` join one native group, and checking one unchecks the other.

## Storybook

`Shared/Radio`: `Default`, `Checked`, `Disabled`, `Group`.
