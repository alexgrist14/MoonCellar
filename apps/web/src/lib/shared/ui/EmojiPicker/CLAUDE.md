# EmojiPicker

A popover for picking an emoji: search field, category buttons, a "Recently used" group and a
scrollable grid. It positions itself under (or above) an anchor element and portals into
`#dropdown-connector`. The emoji list is `emojibase-data`, loaded lazily on first open and
filtered down to what the browser can draw.

## When to use

- Inserting an emoji into text the user is writing; today only `RichEditor` uses it.
- Not a general popover: for menus use `Dropdown`/`Popover`.

## API

| Prop        | Type                             | Default  | Purpose                                                                         |
| ----------- | -------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `anchorRef` | `RefObject<HTMLElement \| null>` | required | Element the popover is positioned against; clicks on it do not close the picker |
| `onSelect`  | `(emoji: string) => void`        | required | Called with the emoji character; the emoji is also added to recents             |
| `onClose`   | `() => void`                     | required | Called on an outside mousedown or Escape                                        |

## Usage

```tsx
import { useRef, useState } from "react";
import { EmojiPicker } from "@/src/lib/shared/ui/EmojiPicker";

const anchorRef = useRef<HTMLButtonElement>(null);
const [isOpen, setIsOpen] = useState(false);

<button
  ref={anchorRef}
  type="button"
  onClick={() => setIsOpen((open) => !open)}
>
  😀
</button>;
{
  isOpen && (
    <EmojiPicker
      anchorRef={anchorRef}
      onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()}
      onClose={() => setIsOpen(false)}
    />
  );
}
```

## Rules and gotchas

- Mount it only while open (`isOpen && <EmojiPicker />`). It looks up its portal target during
  render, which would mismatch hydration if it were part of the server render.
- It stays open after a pick; the parent decides whether `onSelect` also closes it.
- Recents live in the persisted `settings` store (`recentEmojis`/`addRecentEmoji`).
- `emoji.data.ts` probes support by drawing one emoji per version in red and in blue and
  comparing: a colour glyph ignores the fill, a missing box follows it. Keep that comparison and
  its thresholds, and keep drawing with the picker's computed `font-family`. A probe that counts
  any non-red pixel as colour passes under Brave/Firefox canvas noise and shows empty boxes.
  Fully random readback drops to Emoji 5: fewer emoji, never boxes.
- **The category row is a row of square native buttons, not `Tabs`.** `Tabs` now has per-tab
  `ariaLabel` and `tooltip`, so naming is not the obstacle; the shape is. A `Tabs` button is a
  `Button` in the `segmented` or `fancy` theme: 13–14px text, 1:2 padding, `textEllipsis`, and
  equal padding only when `Button` detects a single code point — `❤️` (U+2764 + U+FE0F) is two,
  so the Symbols tab would come out wider than the rest. Keeping the 28px square
  (`--emoji-picker-group-size`), the 16px glyph and the dimmed inactive state would mean
  overriding `Button`'s padding, size and font from this module, which is exactly the
  out-specifying override the shared-UI rules forbid. Selection is also the picker's
  `activeGroup`, driven by search and by the recents group appearing, not a tab index.
- **Each emoji cell keeps a native `title`, not `Tooltip`.** A category holds hundreds of cells,
  and a `Tooltip` per cell adds listeners and a layout effect to every one of them; the native
  attribute costs nothing.
- Clicks inside `#modals` do not close it unless the picker itself lives in a modal
  (`useCloseEvents`).

## Storybook

`Shared/EmojiPicker`: Default (a button that toggles the picker).
