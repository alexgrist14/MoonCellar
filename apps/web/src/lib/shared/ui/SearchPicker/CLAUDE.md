# SearchPicker

A labelled search input with an inline result list: each option shows a small thumbnail, a label
and optional meta. The parent owns the query, the fetching and what happens on a pick; the
component only renders.

## When to use

- Picking one record by searching for it: the main game of a DLC and related games in
  `GameRequestFields`, games in `CharacterEditor`, the target of an update request in
  `RequestForm`, a game the matcher missed in `Conflicts`.
- For a fixed list of options use `Dropdown`. For the site-wide search use the search modal.

## API

| Prop          | Type                                    | Default  | Purpose                                                                 |
| ------------- | --------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `label`       | `string`                                | required | Visible label; also names the result list (`"<label> results"`)         |
| `search`      | `string`                                | required | Current query (controlled)                                              |
| `onSearch`    | `(value: string) => void`               | required | Input change handler                                                    |
| `options`     | `ISearchPickerOption[]`                 | required | Results: `id`, `label`, optional `meta`, `image`, `slug`                |
| `onPick`      | `(option: ISearchPickerOption) => void` | required | Called when a result is clicked                                         |
| `placeholder` | `string`                                | –        | Input placeholder                                                       |
| `isLoading`   | `boolean`                               | –        | Shows "Searching…" instead of "Nothing found" when there are no options |
| `disabled`    | `boolean`                               | –        | Disables the input and the result buttons                               |
| `minLength`   | `number`                                | `2`      | Trimmed query length at which the list appears                          |

## Usage

```tsx
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { useGameSearch } from "@/src/lib/entities/game/model";

const parentSearch = useGameSearch();

<SearchPicker
  label="Main game (for a DLC, expansion or edition)"
  placeholder="Search the main game"
  search={parentSearch.search}
  onSearch={parentSearch.setSearch}
  options={parentSearch.options}
  isLoading={parentSearch.isLoading}
  onPick={(option) => {
    setParent(option);
    parentSearch.setSearch("");
  }}
/>;
```

## Rules and gotchas

- The list stays open as long as the query is long enough; clear the query in `onPick` to close
  it, as every current consumer does.
- Debounce the request in the parent: `onSearch` fires on every keystroke.
- `image` goes through `next/image`, so a remote host must be allowed in `next.config.mjs`
  `images.remotePatterns`.
- **The results always open in an anchored `Popover`** (`matchAnchorWidth`, `isSheetDisabled`,
  portalled into `#dropdown-connector`), never inline: an inline list pushed the content below the
  field down and was clipped by any ancestor with `overflow`. It closes on an outside click or
  Escape and reopens on focus or typing. It reserves `RESULTS_RESERVED_HEIGHT` (440px, eight result
  rows — `useGameSearch` takes 8) when choosing to open below or above, so the panel does not jump
  from below to above once "Searching…" turns into results. Raise it with the result count.
- **A game search is `useGameSearch()` from `entities/game/model`** — debounce, the 2-character
  minimum, the `useGamesQuery` call and the option mapping (name, release year, cover). Do not
  rebuild that next to a picker; map its `options` if a screen needs extra meta, as Conflicts
  does for "already a candidate".
- **Options stay native `<button>`s.** Each option is a full-width result row with a cover and two lines of text, laid out by the picker; `Button`'s centring and ellipsis do not fit a row.

## Storybook

`Shared/SearchPicker`: Default, WithResults, Loading, NothingFound, Disabled, Floating.
