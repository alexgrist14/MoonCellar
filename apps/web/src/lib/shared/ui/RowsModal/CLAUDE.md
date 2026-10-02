# RowsModal

Modal body made of a titled `Box` with a scroll area and a vertical list of "rows" — each row a
two-sided block (icon or meta on one side, text on the other). Shows `emptyState` when there are
no rows. `AchievementsModal` and `GamePlaysInfo` are built on it.

## When to use

- A modal whose content is a title plus a list of similar entries (awards, playthroughs).
- Before building any new modal of that shape, ask the user whether `RowsModal` should be used
  instead of a bespoke layout — do not assume either way.
- For a confirm dialog use `ConfirmModal`; for long free-form content use the `Drawer`.

## API

| Prop           | Type          | Default | Purpose                                                |
| -------------- | ------------- | ------- | ------------------------------------------------------ |
| `rows`         | `ReactNode[]` | —       | One node per row; each is wrapped in a row `div`       |
| `title`        | `string`      | —       | `Box` title                                            |
| `emptyState`   | `ReactNode`   | —       | Rendered instead of the rows when `rows` is empty      |
| `classNameRow` | `string`      | —       | Extra class on every row wrapper                       |
| `className`    | `string`      | —       | Extra class on the list; set the variables below on it |

## Usage

```tsx
import { RowsModal } from "@/src/lib/shared/ui/RowsModal";
import { modal } from "@/src/lib/shared/ui/Modal";

modal.open(
  <RowsModal
    title={gameName}
    rows={playthroughs.map((play) => (
      <Fragment key={play._id}>
        <StatusBadge status={play.category} />
        <p>{play.comment}</p>
      </Fragment>
    ))}
    emptyState={<EmptyState title="No playthroughs yet" />}
  />
);
```

## Rules and gotchas

- **Size the list and the row gap through `--rows-modal-min-width` (320px),
  `--rows-modal-max-width` (420px) and `--rows-modal-row-gap` (`--gap-x3`), declared on the
  `className` you pass — never by overriding `.list`/`.row` from outside.** A caller's class has
  the same specificity as the component's, so which one wins depends on the order the CSS chunks
  load. `AchievementsModal` sets 420–520px and `--gap-x6`.

- **Rows are keyed by index inside the component;** the key on the node you pass is not used for
  the wrapper, so do not rely on row state surviving a reorder.
- **Open it through `modal.open`.** It has no overlay or close button of its own, and props given
  at open time never update afterwards — a row list that changes needs the modal to own its data.
- **The scroll area is `Box`'s `isWithScrollBar`,** capped in `dvh`; a row that sets its own
  `min-height` needs `flex-shrink: 0` or it is squeezed and spills.

## Storybook

`Shared/RowsModal` — `Default`, `Empty`, `ManyRows`.
