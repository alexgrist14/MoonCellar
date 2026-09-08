# Rounded image tiles

Why a light hairline appears around the media thumbnails, which fixes exist, and what this
codebase settled on.

The affected components are the horizontal media rails: `shared/ui/Slideshow` (screenshots and
artworks) and `shared/ui/VideosRow` (video thumbnails). Both render a 240×135 tile with
`border-radius: var(--radius-x2)` and a full-bleed image inside.

---

## 1. The symptom

A pale outline traces every tile, most visible where the page background behind it is light,
and it is strongest at the rounded corners — often reading as a stray bright pixel in the
corner rather than a full ring.

It is not one bug. Two independent mechanisms produce almost the same picture, and fixing only
one leaves a weaker version of the artefact behind.

## 2. Mechanism A — the transparent border shows the tile's own background

The original rule set was:

```scss
border: 2px solid transparent;
background-color: var(--color-bg-secondary);

&:hover {
  border-color: var(--color-accent);
}
```

The intent is reasonable: reserve the ring up front so the tile does not shift by 2px when the
accent appears on hover. The cost is that `border-box` sizing keeps the element at 240×135
while the **content box shrinks to 236×131**. The image fills the content box, so a 2px band
around it is border — and a transparent border is not empty: `background-clip` defaults to
`border-box`, so the tile's own `--color-bg-secondary` paints underneath it.

Against a dark screenshot that band is invisible. Against a bright one it reads as a light
frame, and the rounded corners concentrate it.

## 3. Mechanism B — a clip mask does not round the child

`overflow: hidden` on the parent does not give the child rounded corners; it masks it. The
image keeps square corners and the browser composites it against a rounded mask. Along the
curve the two are resolved with antialiasing, and a fraction of a pixel of whatever sits behind
the image — the parent's background, or the page — survives at the corner.

This is the "same radius on two stacked elements" case: the parent's clip and the child's
square corner meet on the same curve, and nothing guarantees they resolve identically.

## 4. The options

| # | Fix | Removes | Cost |
|---|---|---|---|
| A | Reduce the tile radius | nothing | shortens the artefact, does not remove it |
| B | `border-radius: inherit` on the image | B | breaks if a wrapper sits between parent and image |
| C | `overflow: clip` instead of `hidden` | B (partly) | no scroll container; Chrome 90+/Safari 16+ |
| D | `outline` + negative `outline-offset` instead of the border | A | none for this use |
| E | `box-shadow: inset` instead of the border | A | painted under the content — invisible behind a full-bleed image |
| F | Child radius = parent radius − border width | A (visually) | must be recomputed whenever the border width changes |
| G | `background-clip: padding-box` on the parent | A | the transparent border now shows the *page* behind it, usually worse |
| H | `transform: translateZ(0)` / `isolation: isolate` | B (sometimes) | forces a compositing layer; costs memory, can soften text |
| I | `mask-image` / `clip-path` on the parent | B | heavier to paint, and `clip-path` also clips outlines and shadows |
| J | Drop the parent background | A | loses the placeholder shown while the image loads |

### A. Reduce the radius

The first instinct, and the reason this document exists. A smaller curve means fewer pixels
where the mask and the child disagree, so the artefact gets shorter — but it is still there,
and the tile now looks different for a reason unrelated to design. Treat a radius change as a
design decision, never as a fix for this.

### B. `border-radius: inherit` on the image

Makes the image genuinely rounded instead of merely masked, so there is no square corner left
to peek out. Cheap, no layout effect, no compositing cost.

The catch is `inherit`: it resolves against the **direct parent**. `next/image` renders a plain
`<img>` here, so the value comes straight from the tile. Introduce a wrapper (`fill` mode does
exactly that) and the image inherits `0` from the wrapper instead — write the token explicitly
in that case.

### C. `overflow: clip` instead of `hidden`

`clip` clips at the same box but, unlike `hidden`, does not turn the element into a scroll
container. That removes a class of subpixel drift where the browser reserves a scrollport, and
it also means `scrollIntoView` from inside the tile no longer scrolls *the tile*. Baseline
since Chrome 90 / Safari 16.

Use it together with B, not instead: on its own it still masks a square-cornered child.

### D. `outline` + `outline-offset: -2px`

The right way to reserve a hover ring. An outline is painted outside the box model, so it
changes no geometry: the image can fill the full 240×135, and there is no border band for the
parent background to show through. A negative offset draws the ring inward, over the tile's own
edge, and it follows `border-radius`.

Outlines are not clipped by `overflow` on the same element, so the ring stays crisp at the
corners. They *are* clipped by an ancestor's `clip-path` — a reason to prefer C over I here.

### E. `box-shadow: inset`

Also geometry-free and radius-aware, and it is the usual substitute for a border. It does not
work for this component: inset shadows paint above the background but **below the content**, and
the content here is an image covering the whole tile, so the ring would be hidden. Fine for
tiles with padding, wrong for full-bleed ones.

### F. Compensated child radius

The textbook rule for nested rounded boxes: an inner box inset by `p` should use
`R_outer − p` so the two curves stay concentric. Correct, and the right tool when the inset is
real — but here the inset only exists because of a border we do not actually want. Removing the
border (D) removes the need to compensate at all, and one less coupled constant is worth more
than the arithmetic.

### G. `background-clip: padding-box`

Stops the background from painting under the border, which does kill the light band — and
replaces it with a transparent gap showing the page background through the tile's edge. On a
`BGImage` page that is more distracting than what it fixes.

### H. Forcing a compositing layer

`transform: translateZ(0)`, `will-change: transform` or `isolation: isolate` on the parent can
change how the mask is rasterised and make the corner artefact disappear. It is a rendering
side effect, not a guarantee: it varies by browser and GPU, and it is invisible in the CSS to
whoever reads it later. It also promotes the element to its own layer for every tile in the
rail — measurable memory on a page with 20+ thumbnails. Reach for it only when B and C are not
enough, and leave a comment saying why.

### I. `mask-image` / `clip-path`

Clips reliably and handles shapes a radius cannot. Both are heavier to paint than a radius, and
`clip-path` clips outlines and box shadows too — which would take the hover ring (D) with it.

### J. Drop the parent background

Nothing shows through if nothing is painted. But `background-color` is what fills the tile
while `SlideshowImage` is still loading (it renders a `Loader` over that fill), so removing it
trades a hairline for a hole during load.

## 5. What this codebase uses

**D + B + C**, all three:

```scss
.slideshow__screenshot {
  border-radius: var(--radius-x2);
  overflow: clip;
  outline: 2px solid transparent;
  outline-offset: -2px;
  background-color: var(--color-bg-secondary);

  &:hover {
    outline-color: var(--color-accent);
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
}
```

D removes mechanism A and lets the image fill the tile edge to edge. B removes mechanism B by
giving the image real corners. C removes the scroll container that the mask no longer needs.
`VideosRow` carries the same block.

The radius stayed at `--radius-x2`.

## 6. Writing a new image tile

- Reserve a hover ring with `outline` + negative `outline-offset`, never with a transparent
  `border`.
- Give the image `border-radius: inherit` — or the token itself if a wrapper is in the way.
- Prefer `overflow: clip` unless the element genuinely needs to scroll.
- Keep a `background-color` only if something renders during load.

## 7. The rail edge: partially visible tiles

A related complaint reads like the same bug but is not: once the rail is scrolled, the tile at
the left edge is cut mid-image and its remaining sliver keeps the container's rounded corners,
so it reads as a stray light bar next to the scroll arrow — most visible when the screenshot is
bright.

Nothing is wrong with the clipping; the rail simply stops between tiles.

| Fix | Cost |
|---|---|
| Fade the edges with a scroll-driven `mask-image` | the cut tile is still half-shown, only softened; one extra mask layer per rail |
| `scroll-snap-type: x mandatory` + `scroll-snap-align: start` | **tried and reverted** — see below |
| Widen the arrow button to cover the sliver | breaks as soon as the offset exceeds the button width |

**Snapping was tried and rolled back.** Two problems:

- The rail is dragged through the custom `Scrollbar` thumb, which writes `scrollLeft` directly
  on every mouse move. With `mandatory` snapping each write is pulled to the nearest boundary,
  so dragging stutters instead of tracking the cursor.
- Snap does not correct a programmatic smooth scroll anyway. Setting `scrollLeft` snaps as
  expected, but `scrollBy({ behavior: "smooth" })` lands wherever the animation ends (measured:
  1108px on a 244px pitch), so the arrow button needed its own rounding on top.

**The mask is what shipped.** `Scrollbar` adds `scrollbars__content_faded` when
`isHorizontal && isWithArrows`, and `useScrollbar` writes `--scroll-fade-start` /
`--scroll-fade-end` (`0` or `1`) from `positionHandler` — the same place that shows and hides
the arrows, so it costs no re-render. The gradient multiplies `--scrollbar-fade-width` by that
flag, which means a side with the flag at `0` has its stop at `0px` and stays fully opaque:

```scss
mask-image: linear-gradient(
  90deg,
  transparent 0,
  #000 calc(var(--scroll-fade-start, 0) * var(--scrollbar-fade-width)),
  #000 calc(100% - var(--scroll-fade-end, 0) * var(--scrollbar-fade-width)),
  transparent 100%
);
```

Measured: at `scrollLeft: 0` → start `0`, end `1`; mid-rail → `1`/`1`; at the end → `1`/`0`.
Scrolling behaviour is untouched.

## 8. Verifying

Eyeballing a 240px tile will not settle it — the artefact is one or two device pixels. Drive
Chrome through `playwright-core` with `deviceScaleFactor: 4` and clip a 60×60 box around the
tile's top-left corner, in both the resting and hovered state. The same harness backs
`bun run check:layout`; see that script for the launch options and `CHROME_PATH`.
