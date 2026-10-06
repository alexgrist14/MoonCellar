# Scrollbar

A scroll container with a custom-drawn track and thumb (the native scrollbar is hidden
site-wide). Works vertically or horizontally; the horizontal variant can show start/end arrow
buttons with a masked fade at the cut edges. It also wraps the whole page as `#page-scroll`.

## When to use

- Any element that scrolls. Never rely on the browser's native scrollbar.
- A vertical scroll area with fading top/bottom edges is `ExpandableBlock mode="scroll"`.
- A horizontal media rail is `isHorizontal isWithArrows` (as `Slideshow` and `VideosRow`
  use it).

## API

| Prop                                                                         | Type                                    | Default | Purpose                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `children`                                                                   | `ReactNode`                             | —       | Scrolled content.                                                                                                            |
| `contentStyle`                                                               | `CSSProperties`                         | —       | Style of the scrolling element — set `maxHeight` here to make it scroll.                                                     |
| `containerStyle`                                                             | `CSSProperties`                         | —       | Style of the outer grid container.                                                                                           |
| `classNameContent` / `classNameContainer`                                    | `string`                                | —       | Classes for the scrolling element / outer container.                                                                         |
| `classNameScrollbar` / `classNameTrack` / `classNameThumb` / `classNameLine` | `string`                                | —       | Classes for the scrollbar column, track, thumb, and fade lines.                                                              |
| `type`                                                                       | `"absolute"`                            | —       | Overlay the track instead of reserving space: a 12px column, or the row under horizontal content.                            |
| `isHorizontal`                                                               | `boolean`                               | —       | Horizontal scrolling.                                                                                                        |
| `isWithArrows`                                                               | `boolean`                               | —       | With `isHorizontal`: arrow buttons plus a masked fade at the edges.                                                          |
| `isFaded`                                                                    | `boolean`                               | —       | With `isHorizontal`: the masked fade at the edges without the arrow buttons (the one-line applied filters).                  |
| `fadeType`                                                                   | `"both" \| "top" \| "bottom"`           | —       | Renders gradient line overlays at those edges.                                                                               |
| `isLine`                                                                     | `boolean`                               | —       | With `fadeType`, renders both lines regardless of its value.                                                                 |
| `isChildrenOnly`                                                             | `boolean`                               | —       | Render `children` without the internal scrolling `div`; pair with `initialContentRef`.                                       |
| `initialContentRef`                                                          | `RefObject<HTMLDivElement \| null>`     | —       | Use this element as the scrolling element instead of the internal one.                                                       |
| `isResetScrollPosition`                                                      | `boolean`                               | —       | Scroll back to the start whenever `children` change.                                                                         |
| `id`                                                                         | `string`                                | —       | DOM id of the scrolling element; also the key under which a saved position in `useCommonStore().scrollPosition` is restored. |
| `ref`                                                                        | `RefObject<HTMLDivElement>`             | —       | Ref to the outer container.                                                                                                  |
| `onScroll`                                                                   | `({ scrollTop?, scrollLeft? }) => void` | —       | Scroll callback.                                                                                                             |
| `onScrollBottom`                                                             | `(isBottom: boolean) => void`           | —       | Vertical only; called on every scroll with `true` once within 10px of the bottom.                                            |

## Usage

```tsx
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";

<Scrollbar
  type="absolute"
  classNameContent={styles.list}
  contentStyle={{ maxHeight: "var(--popover-max-height)" }}
>
  {stores.map((store) => (
    <StoreLink key={store.url} store={store} />
  ))}
</Scrollbar>;
```

## Rules and gotchas

- `isHorizontal` reserves a track row below the content (`--scrollbar-horizontal-size` plus
  `--gap-x2`) only while the content overflows; with nothing to scroll the row collapses
  (`scrollbars__container--idle`). Before that, a segmented `Tabs` row that fit its width still
  left 14px of empty space under it, which read as a stray gap in the playthrough modal. The
  row appears when the content starts to overflow, so the block grows by 14px at that moment;
  where that jump or an `align-items: center` sibling matters, pass `type="absolute"`: the track
  then hangs below the content without taking layout height, so leave that much room under it.
- The page itself scrolls inside `#page-scroll` (the `Scrollbar` that `Layout` wraps around
  `main`, id `PAGE_SCROLL_ID`), while `html`/`body` are `overflow: hidden`. Read or move page
  scroll through that element; `window.scrollY` is always 0.
- Never size the page scroller in `vh`; its height chain is percentages on purpose
  (mobile `100vh` is taller than the visible viewport and creates a second scroll).
- Do not put `overscroll-behavior: contain` on a panel inside the page: once the panel hits
  its end, the wheel stops moving `#page-scroll` too. `Scrollbar` leaves it unset on purpose.
- Do not count on `fadeType` for a vertical fade. The masked fade exists only with
  `isHorizontal` + `isWithArrows`; on a vertical area it toggles gradient overlays (visible while
  content lies past that edge) painted in `--color-bg-primary`, which do not match a translucent
  `Box`. Use
  `ExpandableBlock mode="scroll"`.
- Measure the track with `offsetWidth`/`offsetHeight`, never `clientWidth`/`clientHeight`:
  the track has a 1px border and the client box would leave the thumb short of the end.
- Inside a `Box`, `Box`'s module gives the `Scrollbar` container `min-height: 0` so a
  clamped panel can shrink it. A `Scrollbar` placed in another flex column with a capped
  height needs the same, or the content flows past the parent's border.
- Has `"use client"`; it can be rendered from a server component.

## Storybook

`Shared/Scrollbar`: `Vertical`, `AbsoluteTrack`, `Horizontal`, `HorizontalWithArrows`,
`ShortContent` (no thumb).
