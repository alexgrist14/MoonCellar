# Dropdown

A select over a list of strings: single choice, multi choice with checkboxes, multi choice
with an include/exclude third state, optional search, free-text input, reset and select-all
controls. Lists longer than 50 items are virtualised. On mobile (`useStatesStore().isMobile`)
the list opens in a bottom `PopoverSheet` instead.

## When to use

- Picking one or several values from a known list of labels (platforms, categories, sort
  options, filters).
- A sort-by field with its order toggle is `SortControl`; a date is `DatePicker`; a row of
  mutually exclusive options that fits on screen is `Tabs` (`theme="segmented"`).

## API

| Prop                                               | Type                              | Default                                   | Purpose                                                                                              |
| -------------------------------------------------- | --------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `list`                                             | `string[]`                        | —                                         | Labels to show. Values are reported by label or by index into this array.                            |
| `title`                                            | `string`                          | —                                         | Heading (`h4`) above the field; also the mobile sheet title.                                         |
| `placeholder`                                      | `string`                          | `"Select..."` / `"Enter/Select value..."` | Field text when empty.                                                                               |
| `initialValue`                                     | `string`                          | —                                         | Starting single value.                                                                               |
| `overwriteValue`                                   | `string`                          | —                                         | Controlled single value; every change overwrites the internal one.                                   |
| `initialMultiValue`                                | `number[]`                        | —                                         | Selected indexes (multi). Re-applied whenever the array identity changes.                            |
| `initialExcludeValue`                              | `number[]`                        | —                                         | Excluded indexes (with `isWithExclude`).                                                             |
| `getValue`                                         | `(value: string \| null) => void` | —                                         | Single choice by label (`null` on reset); with `isWithInput` also fires on blur with the typed text. |
| `getIndex`                                         | `(index: number) => void`         | —                                         | Single choice by index (`-1` on reset).                                                              |
| `getValues` / `getIndexes`                         | `(string[]) / (number[]) => void` | —                                         | Multi choice.                                                                                        |
| `getExcludeValues` / `getExcludeIndexes`           | `(string[]) / (number[]) => void` | —                                         | Excluded items (with `isWithExclude`).                                                               |
| `getSearchQuery`                                   | `(value: string) => void`         | —                                         | Moves search to the caller (server search); the list is no longer filtered locally or reordered.     |
| `onLoad`                                           | `() => void`                      | —                                         | Fires the first time the list opens (lazy loading).                                                  |
| `onClose`                                          | `() => void`                      | —                                         | Fires whenever an open list is closed (never on mount).                                              |
| `isMulti`                                          | `boolean`                         | —                                         | Checkbox multi select.                                                                               |
| `isWithExclude`                                    | `boolean`                         | —                                         | Third state per item: checked → excluded → off.                                                      |
| `isWithAll`                                        | `boolean`                         | —                                         | Select-all checkbox in the field (multi only).                                                       |
| `isWithReset`                                      | `boolean`                         | —                                         | Red "Reset" button while a value is set.                                                             |
| `isWithSearch`                                     | `boolean`                         | `list.length > 10`                        | Search box at the top of the list.                                                                   |
| `isWithInput`                                      | `boolean`                         | —                                         | The field becomes a text input that also accepts free values.                                        |
| `isThroughPortal`                                  | `boolean`                         | —                                         | Render the list into `#dropdown-connector`.                                                          |
| `isCompact`                                        | `boolean`                         | —                                         | Smaller field.                                                                                       |
| `isDisabled`                                       | `boolean`                         | —                                         | Disables the field and the chevron.                                                                  |
| `isLoading`                                        | `boolean`                         | —                                         | Renders a skeleton instead of the field.                                                             |
| `borderTheme`                                      | `"default" \| "green" \| "red"`   | —                                         | Field and list border colour.                                                                        |
| `icons`                                            | `string[]`                        | —                                         | Image per item, by index (`next/image`).                                                             |
| `maxHeight`                                        | `string`                          | `"300px"`                                 | Max height of the list (also the virtual list viewport).                                             |
| `rootRef` / `overflowRootId`                       | `RefObject` / `string`            | —                                         | Container whose bottom edge the inline list must not cross; the list shifts up to fit.               |
| `className`, `style`, `fieldStyle`, `wrapperStyle` |                                   | —                                         | Styling of the dropdown, field and outer wrapper.                                                    |

## Usage

```tsx
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";

<Dropdown
  isThroughPortal
  placeholder="Select platform..."
  list={platforms.map((p) => p.name)}
  overwriteValue={platforms.find((p) => p._id === platformId)?.name || ""}
  getIndex={(index) => setPlatformId(platforms[index]._id)}
/>;
```

## Rules and gotchas

- The list renders inline unless `isThroughPortal` is set: it is an absolutely positioned
  child of the field, so any ancestor with `overflow` (a modal's scroll area, a `Box` with
  `isWithScrollBar`) clips it. Pass `isThroughPortal` for every dropdown inside a modal or a
  scrollable panel. The portal list follows the field on scroll and resize, and
  `#dropdown-connector` sits after `ModalsConnector` in `Layout`, so it stays above modals.
  Without that element the portal list never renders.
- The wrapper has `min-width: 170px`, so two dropdowns do not fit side by side on a phone.
  Override from the parent module with a child selector (`flex: 1 1 0; min-width: 0`), not
  by lowering the shared minimum.
- It renders its own `<button>`s (Reset) without `type`; inside a native `<form>` they
  submit it. Drive such forms without a native `<form>` or keep the dropdown outside it.
- With an empty `list` and neither `isWithSearch` nor `isWithInput`, the field is disabled
  and never opens.
- A single value not contained in `list` is dropped back to `initialValue` (unless
  `isWithInput` or `overwriteValue` is set).
- `getValues`/`getExcludeValues` map indexes through the full `list`, in `list` order, whatever
  the search query.
- `initialMultiValue` is re-applied on every new array identity — pass a memoised array or
  each parent render resets the selection.

## Storybook

`Shared/Dropdown`: `Default`, `WithTitle`, `Selected`, `WithReset`, `Multi`, `WithExclude`,
`WithSearch`, `WithInput`, `Compact`, `BorderThemes`, `Disabled`, `Loading`, `Empty`,
`ThroughPortal`.
