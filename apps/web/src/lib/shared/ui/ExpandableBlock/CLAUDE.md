# ExpandableBlock

Collapses long content to a fixed height and, when it overflows, shows a "Show more" button
that opens the full content in a modal or in the side drawer. A third mode keeps the content
in place as a short scroll area with fading edges.

## When to use

- Long text or link lists on a page that must stay in the server-rendered HTML: summaries,
  reviews, keyword chips.
- `mode="scroll"` for a short vertical scroll area with fades (game Summary / Storyline).
  This, not `Scrollbar`'s `fadeType`, is how to get faded edges on a vertical scroll.
- Not for interactive disclosure of controls or sections — that is `ExpandMenu`.

## API

| Prop               | Type                              | Default   | Purpose                                                                                                                                                                             |
| ------------------ | --------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                       | —         | The content.                                                                                                                                                                        |
| `mode`             | `"modal" \| "drawer" \| "scroll"` | `"modal"` | Where "Show more" opens the content, or `scroll` for an in-place scroll area.                                                                                                       |
| `clampHeight`      | `string`                          | —         | Collapsed height (any CSS length / `var()`). Without it the content is clamped to 4 lines with the `lineClamp` mixin; in `scroll` mode it defaults to `--expandable-scroll-height`. |
| `title`            | `string`                          | —         | Title of the modal `Box` or the drawer. Unused in `scroll` mode.                                                                                                                    |
| `className`        | `string`                          | —         | Outer wrapper.                                                                                                                                                                      |
| `classNameContent` | `string`                          | —         | Content element; also applied to the copy shown in the modal/drawer.                                                                                                                |

## Usage

```tsx
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock";

<ExpandableBlock
  title="Keywords"
  clampHeight="var(--game-keywords-collapsed-height)"
  classNameContent={styles.chips}
>
  {keywords.map((keyword) => (
    <Chip key={keyword} label={keyword} />
  ))}
</ExpandableBlock>;

<ExpandableBlock title="Summary" mode="scroll">
  <p>{game.summary}</p>
</ExpandableBlock>;
```

## Rules and gotchas

- Collapse long lists with this component (or the `lineClamp` mixin), never by slicing the
  array: the hidden items stay in the DOM and in the SSR HTML, which is what search engines
  read on game pages.
- The default 4-line clamp works for inline text only. Block or flex content (chips, rich
  text with several paragraphs) needs an explicit `clampHeight`.
- `mode="drawer"` needs `DrawerConnector` (mounted once in `Layout`). Its button carries
  `data-drawer-trigger`; without that attribute the drawer would close on mousedown and
  reopen on click instead of swapping content.
- `mode="modal"` opens through `modal.open` with the fixed id `"expandable-block"`, so it
  needs `ModalsConnector`, and the modal shows a snapshot of `children` at click time.
- Overflow is measured after mount, so the "Show more" button never appears in the server
  HTML; the content itself always does.
- It carries `"use client"`, so unlike most shared UI it can be rendered directly from a
  server component; `children` must then be serialisable JSX (no functions).

## Storybook

`Shared/ExpandableBlock`: `ModalMode`, `ClampHeight`, `ShortContent` (no button),
`ScrollMode`. Drawer mode has no story: Storybook does not mount `DrawerConnector`.
