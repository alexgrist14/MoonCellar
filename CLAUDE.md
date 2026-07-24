# MoonCellar

## Package manager

This project uses **bun** exclusively. Using `npm` is forbidden.

- Install dependencies with `bun install` (never `npm install`).
- Add/remove packages with `bun add` / `bun remove`.
- Run scripts with `bun run <script>` (or `bunx` for one-off binaries).
- Do not create or commit `package-lock.json` — only `bun.lock`/`bun.lockb` is allowed.

## Code generation

- Do not add comments when generating or modifying code.

## Styling

- Only use the global CSS variables defined in `:root` (see `src/lib/app/styles/vars/`) for colors, borders, padding, radius, gap, etc. — never hardcode raw values (hex colors, px, etc.) for anything already covered by a `:root` variable.
- If a new value is needed that isn't covered by an existing `:root` variable, add it as a new CSS variable in `:root` (in the relevant file under `src/lib/app/styles/vars/`) instead of hardcoding it inline.

## Layout

- Any large block/section (a page section, a card, a panel, etc.) must be wrapped in the shared `Box` component from `src/lib/shared/ui/Box`.
- If a `Box` instance needs a different visual appearance, do it through `Box`'s own props (`className`, `classNameContent`, `wrapperStyle`, `templateStyle`, `contentStyle`, `isWithoutBorder`, `isWithBlur`, etc.) — never by overriding `Box`'s internal styles from outside or duplicating its markup/styles in a custom wrapper.
- `Box`'s own radius is `var(--radius-x5)`. For structural UI wrapper components rendered directly inside a `Box` (`Button`, `Input`, `Textarea`, `CustomDropdown`, and similar reusable "chrome" primitives — not decorative elements like game covers/posters), the `border-radius` must be exactly one step below its structural parent's on the `--radius-x*` scale (parent `x5` → child `x4` → grandchild `x3`, etc.). This rule applies to structural wrapper nesting only, not to decorative/illustrative radii (e.g. card art, covers), which are a deliberate style choice independent of nesting depth.

## Scrolling

- Never rely on the browser's default/native scrollbar for a scrollable area. Use the shared `Scrollbar` component from `src/lib/shared/ui/Scrollbar` for any element that needs to scroll (vertically or horizontally via the `isHorizontal` prop).

## Icons

- Do not use the `Icon` component from `@iconify/react` (or any other icon library component).
- Use SVG components from `src/lib/shared/ui/svg` instead. If the needed icon doesn't exist there yet, add a new `Svg*` component to that folder (following the existing components' pattern) and export it from `src/lib/shared/ui/svg/index.ts`.
- New `Svg*` components must be built with the shared `Svg` and `Path` components from `src/lib/shared/ui/svg/Svg/Svg.tsx` — do not write raw `<svg>`/`<path>` tags.

## Language

- This CLAUDE.md file must be written in English only.

## Zod schemas

- The zod schema files in `MoonCellar-Server/src/shared/zod/schemas/` and
  `MoonCellar/src/lib/shared/lib/schemas/` are byte-identical copies. The server copy is
  canonical — `createZodDto` generates the NestJS DTOs from it.
- Any change to a schema must be applied to both copies in the same change, byte for byte.
- Verify with `bun run check:schemas`.
- `igdb.schema.ts` is client-only and exempt.
