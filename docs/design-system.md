# Design system

What a mockup needs to look like MoonCellar, and how it stays that way when the site changes.

The behavioural rules — which component to reach for, what must not be hardcoded — live in
[`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md). This file covers the token layer and the mockup
workflow built on top of it.

---

## One source of truth

Every CSS custom property the site uses is declared in three files:

```
apps/web/src/lib/app/styles/vars/
├── _colors.scss       palette and semantic colour roles
├── _common.scss       spacing, radii, motion, layout constants
└── _components.scss   per-component sizes and per-category colours
```

`root.scss` forwards all three into the app. **Nothing else declares a token**, and mockups must
not restate one — they consume the same declarations.

`bun --filter web sync:tokens` reads those files and writes the block into every mockup and into
`docs/design-tokens.css`. Change a hex in `_colors.scss`, run it, and the mockups follow.
`bun --filter web check:tokens` does the same read-only and exits `1` when anything is stale —
that is the form to put in CI.

The sync is one-directional: **SCSS is the source, mockups are the output.** Editing the
generated block inside a mockup is pointless; the next run overwrites it.

---

## Starting a mockup

Copy the template and rename it:

```bash
cp docs/mockups/_template.html docs/mockups/<name>.html
bun --filter web sync:tokens
```

The template already carries the marker pair, the `--mock-` convention, a panel matching `Box`,
and the note about the substituted font. The sync fills the block between

```html
/* mooncellar-tokens:start */
/* mooncellar-tokens:end */
```

with the current `:root`. A file missing either marker is reported as `no-markers` and skipped —
it silently stops tracking the design system otherwise, which is the one failure this workflow
cannot detect for you.

Prefix anything the mockup invents with `--mock-`. That keeps the boundary obvious: a name
without the prefix comes from the site, a name with it exists only for the mockup and is a
candidate to promote into `vars/` if the design ships.

The template is synced like any other mockup, so it never drifts from the tokens it shows.

---

## Palette

Backgrounds step from dark to light as elements stack. A panel on the page ground uses
`--color-bg-primary`; something lifted above it uses `--color-bg-secondary`; chips and inputs
inside that use `--color-bg-tertiary`.

| Token | Value | Use |
|---|---|---|
| `--color-bg-primary` | `#191d24` | Panel surface — `Box` sits on this |
| `--color-bg-secondary` | `#212731` | Raised surface — modals, popovers, table headers |
| `--color-bg-tertiary` | `#2c3340` | Chips, inline code, controls inside a panel |
| `--color-bg-hover` | `#374151` | Hover fill for ghost/icon buttons |
| `--color-bg-accent` | `#6951ee` | Primary action fill |
| `--color-border-primary` | `#262d2f` | Every hairline and panel edge |

Each background has a `-tint` variant (`#…ee`) for surfaces that sit over artwork —
that is what keeps text legible above `BGImage`.

Text takes semantic tokens, never a raw neutral:

| Token | Use |
|---|---|
| `--color-text-primary` | Headings and main copy |
| `--color-text-secondary` | Body text, intro paragraphs |
| `--color-text-muted` | Captions, metadata, breadcrumbs |
| `--color-gray` | Placeholders and the quietest labels |

Accent is `--color-accent` `#6951ee` and carries focus rings, active states and primary
actions. Status colours are separate from it: `--color-positive` `#00c292`,
`--color-negative` `#d02729`, `--color-yellow` `#ffc451`.

Game categories have their own fixed colours, and a mockup showing a status must use them
rather than picking a hue: `--game-completed-color`, `--game-playing-color`,
`--game-backlog-color`, `--game-wishlist-color`, `--game-dropped-color`,
`--game-played-color`, `--game-mastered-color`.

---

## Scales

All three scales are multiples of 4px, so `x3` is 12px everywhere.

- **Spacing** — `--padding-x1` … `--padding-x25` and `--gap-x05` … `--gap-x12`. Use `gap` on a
  flex or grid parent, not margins on children.
- **Radius** — `--radius-x1` (4px) … `--radius-x10`. `Box` is `--radius-x5`; a structural
  wrapper nested inside it steps down one level per depth, so a `Button` in a `Box` is
  `--radius-x4`. Decorative radii (covers, artwork) are exempt.
- **Motion** — `--duration-fast` 160ms, `--duration-base` 280ms, `--easing-out`. Under
  `prefers-reduced-motion` set `--duration-instant`, never `animation: none`: exit animations
  that unmount a node depend on `animationend` firing.

Breakpoints are max-width, in `_media.scss`: `mediaSm` 500, `mediaMd` 768, `media960` 960,
`mediaLg` 996, `mediaGt` 1200, `mediaEx` 1440, `mediaXx` 1724.

---

## Type

The site ships two local faces, loaded through `next/font/local` in `app/layout.tsx`:

- **ApercuPro** — `--font-general`, everything
- **Pentagra** — `--font-pentagra`, display accents

Neither can be served to a published mockup: they are licensed files, and an artifact may only
pull fonts from Google Fonts. Substitute a grotesque of similar width — **Hanken Grotesk** is
the closest free stand-in for Apercu — and say so on the page, so nobody reads the mockup as a
typography proposal. In the app the component takes the real face from `--font-general`.

---

## What a mockup still has to respect

A mockup that ignores these produces a design that cannot be built as drawn:

- **Every block sits inside a `Box`.** Nothing renders directly on the page background —
  `BGImage` puts game artwork behind the content, and only `Box`'s tinted panel keeps text
  readable over it. Blocks too small to deserve a panel get grouped into a neighbouring one.
- **Icons come from `shared/ui/svg`.** Icon libraries are banned. Drawing a control with an icon
  that does not exist there means adding an `Svg*` component built on the shared `Svg`/`Path` —
  count that in the estimate.
- **Scrollable areas use the shared `Scrollbar`,** date fields use `DatePicker`, multi-line
  truncation uses the `lineClamp` mixin. Native scrollbars and `<input type="date">` do not
  match the theme.
- **Page content must survive server rendering.** A mockup that only works after a measurement
  pass or a client-only flag describes something `docs/seo.md` forbids on game pages.

---

## Files

| Path | What it is |
|---|---|
| `apps/web/src/lib/app/styles/vars/*.scss` | The tokens. Edit here. |
| `docs/design-tokens.css` | Generated snapshot — paste-able into any prototype. |
| `docs/mockups/_template.html` | Starting point for a new mockup. |
| `docs/mockups/*.html` | Mockups; token block injected between the markers. |
| `apps/web/scripts/sync-design-tokens.mjs` | The sync, with `--check` for CI. |
