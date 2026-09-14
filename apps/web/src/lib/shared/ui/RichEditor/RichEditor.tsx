import {
  FC,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import classNames from "classnames";
import styles from "./RichEditor.module.scss";
import {
  SvgBold,
  SvgCode,
  SvgHeading,
  SvgImage,
  SvgItalic,
  SvgLink,
  SvgListBullet,
  SvgListNumbered,
  SvgQuote,
  SvgStrike,
} from "../svg";
import { ISvgBaseProps } from "../svg/Svg/Svg";
import { filesAPI } from "../../api/files.api";
import { toast } from "../../utils/toast.utils";
import { Loader } from "../Loader";

export interface IRichEditorHandle {
  flushUploads: () => Promise<string>;
}

interface IRichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  limit?: number;
  className?: string;
  error?: { message?: string };
  ref?: Ref<IRichEditorHandle>;
}

interface IToolDef {
  key: string;
  title: string;
  icon: FC<ISvgBaseProps>;
  isActive?: (editor: Editor) => boolean;
  run?: (editor: Editor) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const textTools: IToolDef[] = [
  {
    key: "bold",
    title: "Bold",
    icon: SvgBold,
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    key: "italic",
    title: "Italic",
    icon: SvgItalic,
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    key: "strike",
    title: "Strikethrough",
    icon: SvgStrike,
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    key: "code",
    title: "Code",
    icon: SvgCode,
    isActive: (editor) => editor.isActive("code"),
    run: (editor) => editor.chain().focus().toggleCode().run(),
  },
];

const blockTools: IToolDef[] = [
  {
    key: "heading",
    title: "Heading",
    icon: SvgHeading,
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    run: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    key: "bulletList",
    title: "Bullet list",
    icon: SvgListBullet,
    isActive: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    key: "orderedList",
    title: "Numbered list",
    icon: SvgListNumbered,
    isActive: (editor) => editor.isActive("orderedList"),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    key: "blockquote",
    title: "Quote",
    icon: SvgQuote,
    isActive: (editor) => editor.isActive("blockquote"),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];

export const RichEditor: FC<IRichEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Write something…",
  limit = 4000,
  className,
  error,
  ref,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(new Map<string, File>());
  const [pendingCount, setPendingCount] = useState(0);
  const [linkValue, setLinkValue] = useState<string | undefined>();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "nofollow noopener noreferrer", target: "_blank" },
        },
      }),
      Image,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit }),
    ],
    content: value,
    editorProps: { attributes: { class: styles.editor__body } },
    onUpdate: ({ editor }) => onChange?.(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value === (editor.isEmpty ? "" : editor.getHTML())) return;

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const attachImage = useCallback(
    (file: File) => {
      if (!editor) return;

      if (file.size > MAX_IMAGE_BYTES) {
        toast.error({
          title: "Image too large",
          description: "Pick a file under 5 MB.",
        });
        return;
      }

      const src = URL.createObjectURL(file);

      pendingRef.current.set(src, file);
      setPendingCount(pendingRef.current.size);

      editor.chain().focus().setImage({ src, alt: file.name }).run();
    },
    [editor]
  );

  useEffect(
    () => () => {
      pendingRef.current.forEach((_, src) => URL.revokeObjectURL(src));
      pendingRef.current.clear();
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      flushUploads: async () => {
        if (!editor) return "";

        let html = editor.isEmpty ? "" : editor.getHTML();

        for (const [src, file] of [...pendingRef.current.entries()]) {
          if (!html.includes(src)) {
            URL.revokeObjectURL(src);
            pendingRef.current.delete(src);
            continue;
          }

          const { data: uploaded } = await filesAPI.uploadCommentImage(file);

          html = html.split(src).join(uploaded);

          URL.revokeObjectURL(src);
          pendingRef.current.delete(src);
        }

        setPendingCount(pendingRef.current.size);

        if (html !== (editor.isEmpty ? "" : editor.getHTML())) {
          editor.commands.setContent(html, { emitUpdate: false });
          onChange?.(html);
        }

        return html;
      },
    }),
    [editor, onChange]
  );

  const applyLink = () => {
    if (!editor || linkValue === undefined) return;

    const href = linkValue.trim();

    setLinkValue(undefined);

    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  if (!editor) {
    return (
      <div className={classNames(styles.editor, styles.editor_loading, className)}>
        <Loader type="pulse" />
      </div>
    );
  }

  const renderTool = ({ key, title, icon: Icon, isActive, run }: IToolDef) => (
    <button
      key={key}
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={isActive?.(editor) ?? false}
      className={classNames(styles.editor__tool, {
        [styles.editor__tool_active]: isActive?.(editor),
      })}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run?.(editor)}
    >
      <Icon size="16" />
    </button>
  );

  const used = editor.storage.characterCount.characters();

  return (
    <div
      className={classNames(
        styles.editor,
        { [styles.editor_error]: !!error?.message },
        className
      )}
    >
      <div className={styles.editor__toolbar}>
        {textTools.map(renderTool)}
        <span className={styles.editor__separator} />
        {blockTools.map(renderTool)}
        <span className={styles.editor__separator} />
        {renderTool({
          key: "link",
          title: "Link",
          icon: SvgLink,
          isActive: (editor) => editor.isActive("link"),
          run: (editor) =>
            setLinkValue(editor.getAttributes("link").href ?? ""),
        })}
        <button
          type="button"
          title="Image"
          aria-label="Image"
          className={styles.editor__tool}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <SvgImage size="16" />
        </button>
      </div>

      {linkValue !== undefined && (
        <div className={styles.editor__link}>
          <input
            autoFocus
            type="url"
            placeholder="https://"
            aria-label="Link address"
            className={styles.editor__linkField}
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkValue(undefined);
            }}
          />
          <button
            type="button"
            className={styles.editor__linkApply}
            onClick={applyLink}
          >
            Apply
          </button>
        </div>
      )}

      <EditorContent editor={editor} className={styles.editor__content} />

      <div className={styles.editor__footer}>
        <span className={styles.editor__counter}>
          {used} / {limit}
          {pendingCount > 0 &&
            ` · ${pendingCount} image${pendingCount > 1 ? "s" : ""} pending upload`}
        </span>
        {!!error?.message && (
          <span className={styles.editor__error}>{error.message}</span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) attachImage(file);
        }}
      />
    </div>
  );
};
