# RichEditor

The rich-text editor for user comments, reviews and playthrough notes, built on Tiptap
(StarterKit with h3 only, links, images, placeholder, grapheme-aware character count). The
toolbar covers bold, italic, strike, code, heading, lists, quote, link, image and an emoji
picker. Images are held locally as blob URLs and uploaded only when the caller flushes them.

## When to use

- Any field where a user writes formatted text that is later shown with `RichText`.
- Plain single-line or short text is `Input` / `Textarea`.
- To display stored HTML use `RichText`, never this editor in a read-only state and never
  `dangerouslySetInnerHTML`.

## API

| Prop          | Type                     | Default              | Purpose                                                                           |
| ------------- | ------------------------ | -------------------- | --------------------------------------------------------------------------------- |
| `value`       | `string`                 | `""`                 | HTML content. Controlled: an external change replaces the document.               |
| `onChange`    | `(html: string) => void` | —                    | Called on every edit with the HTML, or `""` when the document is empty.           |
| `placeholder` | `string`                 | `"Write something…"` | Placeholder shown in an empty document.                                           |
| `limit`       | `number`                 | `4000`               | Maximum characters (grapheme clusters, so an emoji counts as one).                |
| `className`   | `string`                 | —                    | Outer wrapper.                                                                    |
| `error`       | `{ message?: string }`   | —                    | Red state plus the message in the footer; accepts a react-hook-form `FieldError`. |
| `ref`         | `Ref<IRichEditorHandle>` | —                    | Exposes `flushUploads()`.                                                         |

`IRichEditorHandle.flushUploads(): Promise<string>` uploads every pending image still present
in the document through `filesAPI.uploadCommentImage`, swaps the blob URLs for the uploaded
ones, calls `onChange`, and resolves with the final HTML.

## Usage

```tsx
import { useRef } from "react";
import { RichEditor, IRichEditorHandle } from "@/src/lib/shared/ui/RichEditor";

const editorRef = useRef<IRichEditorHandle>(null);

<Controller
  control={control}
  name="comment"
  render={({ field }) => (
    <RichEditor
      ref={editorRef}
      value={field.value || ""}
      onChange={field.onChange}
      error={errors.comment}
    />
  )}
/>;

const onSubmit = async (data: FormValues) => {
  const comment = await editorRef.current?.flushUploads();
  save({ ...data, comment });
};
```

## Rules and gotchas

- Call `flushUploads()` before saving and send the HTML it returns. Saving `value` directly
  stores `blob:` URLs that no one else can load. Pending images not uploaded are counted in
  the footer.
- Wire it into react-hook-form through `Controller`, not `setValue`/`watch`: a field driven
  only by `setValue` never recomputes `isValid`. Hiding the field must not unmount the
  `Controller`, or the registration drops and a `disabled: !isValid` button locks.
- The editor content area uses the same `richText` mixin as `RichText`, so it shows what the
  reader will see. Do not restyle paragraphs or image width here alone; change the mixin.
- `immediatelyRender: false`: the first render (and the server render) is a loader; the
  toolbar appears after mount.
- Images over 5 MB are rejected with a toast. Blob URLs are revoked on unmount.
- The emoji picker portals into `#dropdown-connector` (falling back to `body`).
- All toolbar buttons have `type="button"`, so the editor is safe inside a native `<form>`.
- **Toolbar buttons are native `<button>`s wrapped in `Tooltip`, not `Button`.** They need
  `onMouseDown={e => e.preventDefault()}` so a click does not steal focus (and the selection)
  from the document, and `Button` does not pass `onMouseDown` through. Their names come from
  `aria-label` plus the `Tooltip`; do not add a native `title`, which would show a second
  tooltip.
- The groups are divided by the shared `Separator` at `--rich-editor-separator-height` (its
  `height: 100%` would collapse in the centred toolbar row). The link row is `Input` plus a
  compact accent `Button` "Apply".
- Uses hooks and has no `"use client"`: import it from a client component only.

## Storybook

`Shared/RichEditor`: `Empty`, `WithContent`, `WithError`, `ShortLimit`. Do not insert images
expecting them to save — `flushUploads` needs the API.
