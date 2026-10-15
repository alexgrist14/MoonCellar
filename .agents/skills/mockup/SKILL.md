---
name: mockup
description: Build or update a MoonCellar design mockup — a static HTML proposal for a screen, a component, a state or a flow, kept in docs/mockups and published as an Artifact for review. Use whenever the user asks, in any language, for a mockup, a prototype, a design proposal, variants of a UI or "how would X look"; also before building a new screen or reshaping an existing one when the look is not settled yet.
---

# Mockup

A mockup here is a specification of something buildable with the site's own tokens and
components, not a free design exercise. It lives in the repository, tracks the design tokens,
and is reviewed in the browser through an Artifact.

## Read first

- `docs/design-system.md` — the token layer, the template, the font substitution and what a
  mockup must still respect.
- The **Mockups** section of `apps/web/CLAUDE.md` — the rules that break silently.
- `docs/branding.md` — before showing the logo or any brand surface.
- For every control you draw: `apps/web/src/lib/shared/ui/<Name>/CLAUDE.md` and its
  `<Name>.stories.tsx`. Draw it the way the stories render it, never from memory.
- For an existing screen: the page's `CLAUDE.md` (`apps/web/src/lib/pages/<Page>/`) and the
  widget code, so the "current" side of the mockup is the real one.

## Skills to load

- **`frontend-design`** for composition, hierarchy and the single job of the page. Its advice to
  pick a new palette, typeface or "aesthetic risk" does not apply: colours, type, radii and
  controls come from the design system. A new look is proposed only when the user asks for one,
  and then through `--mock-` tokens (below).
- **`artifact-design`** before publishing — the Artifact tool requires it. Where its page
  contract and this repository disagree, the repository's file stays the source of truth: change
  only what publishing needs.

## Steps

1. **Name it for its subject**: `docs/mockups/<subject>.html` (`conflicts-ai.html`, not
   `task-12.html`). Check `docs/mockups/` first — updating an existing mockup beats starting a
   second one on the same subject.
2. **Start from the template** and sync the tokens:

   ```bash
   cp docs/mockups/_template.html docs/mockups/<subject>.html
   bun --filter web sync:tokens
   ```

   Never edit between `/* mooncellar-tokens:start */` and `/* mooncellar-tokens:end */`; the
   sync overwrites it. A file without both markers silently stops tracking the tokens.
3. **Write the page**:
   - The `<title>`, the `h1` and the eyebrow (`MoonCellar · <subject>`) name the subject.
   - The lede says what is being decided and how the options differ.
   - Every colour, spacing, radius, duration and size is `var(--…)` from the generated block.
     Anything the mockup invents is a `--mock-` property declared in the template's own
     `:root`, never a raw value in a rule — those are the candidates to promote into
     `apps/web/src/lib/app/styles/vars/` if the design ships.
   - Every block sits in a panel styled like `Box` (the template's `.box`).
   - Icons are copied from the `Svg*` components in `apps/web/src/lib/shared/ui/svg`. A glyph
     that does not exist there is marked in the mockup as a new `Svg*` to add.
   - All copy is English, and the data is real: catalogue game names, plausible counts and
     dates. No lorem ipsum.
   - Show the states the build will need: empty, loading, long text, disabled, error — the
     same ones the component stories cover — and the phone width.
   - Changing an existing screen: put "Current" next to the proposal. Several options: label
     them A, B, C and say in one line what each trades off.
   - Keep the template's closing note about the substituted typeface (Hanken Grotesk for
     ApercuPro), so nobody reads it as a typography proposal.
4. **Check the tokens**: `bun --filter web check:tokens` must pass.
5. **Look at it** at a desktop width and at 390px: no horizontal scroll, nothing on the bare
   background, controls matching Storybook (`bun run storybook`, port 4222).
6. **Publish it as an Artifact** — always, without being asked — and give the user the link:
   - Publish the repository file itself; it stays the source of truth.
   - A first publish takes a generic `icon` word (`layout`, `design`), never a brand name.
   - A logo, if shown, is one of the three files in `apps/web/public/images` (`logo-icon.png`,
     `logo-text.png`, `logo-full.png`), published next to the page through the Artifact
     `files` option and referenced by a relative path. Never redraw or recolour it.
   - Record the link in an HTML comment on the file's first line,
     `<!-- artifact: https://claude.ai/... -->`. A later session reads it and publishes with
     that `url`, so the link the user already has keeps working instead of a new one appearing.
7. **On every later change**: edit the repository file, run `sync:tokens`, then republish to
   the recorded `url`.

## Done means

- `docs/mockups/<subject>.html` exists, carries both token markers and the artifact comment,
  and `check:tokens` passes.
- The user has the Artifact link.
- Every `--mock-` token is listed in the reply as "new tokens if this ships", or the reply says
  there are none.
