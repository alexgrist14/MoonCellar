# SaveForm

A small `Box` with one autofocused `Input` and an accent "Save" button, for naming something
before saving it. It keeps the typed name in local state and hands it to `saveCallback` on click
or Enter. Used inside a modal to name a royal games preset (`RoyalGamesPanel`).

## When to use

- A one-field "give it a name" prompt, typically opened with `modal.open(<SaveForm … />)`.
- Not for anything with more than a name or with validation — build a form with `Input` and
  react-hook-form.
- Not for a yes/no question — use `ConfirmModal`.

## API

| Prop           | Type                     | Default           | Purpose                                   |
| -------------- | ------------------------ | ----------------- | ----------------------------------------- |
| `saveCallback` | `(name: string) => void` | —                 | Receives the typed name on Save or Enter. |
| `placeholder`  | `string`                 | `"Enter name..."` | Input placeholder.                        |

## Usage

```tsx
import { modal } from "@/src/lib/shared/ui/Modal";
import { SaveForm } from "@/src/lib/shared/ui/SaveForm";

modal.open(
  <SaveForm
    placeholder="Preset name..."
    saveCallback={(name) => {
      addPreset({ name, games: royalGames });
      modal.close();
    }}
  />
);
```

## Rules and gotchas

- It does not close anything itself; `saveCallback` must close the modal it was opened in.
- Enter, like the disabled Save button, does nothing while the input is empty.
- The name is not trimmed; trim it in the callback if whitespace matters.
- `modal.open` stores the element once, so `placeholder` and `saveCallback` are frozen at open
  time; the callback must not rely on values captured from a later render.

## Storybook

`Shared/SaveForm` — `Default`, `CustomPlaceholder`.
