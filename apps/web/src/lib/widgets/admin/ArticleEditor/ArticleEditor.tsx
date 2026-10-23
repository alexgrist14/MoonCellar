"use client";

import { FC, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ARTICLE_SUMMARY_MAX,
  ARTICLE_TEXT_LIMIT,
  ARTICLE_TITLE_MAX,
  IArticle,
  IArticleStatus,
  IArticleType,
  SaveArticleRequestSchema,
} from "@mooncellar/schemas";
import {
  useDeleteArticleMutation,
  useSaveArticleMutation,
} from "@/src/lib/entities/article/api";
import { revalidateArticlePage } from "@/src/lib/entities/article/api/article.actions";
import {
  formatArticleDate,
  getArticleHref,
} from "@/src/lib/entities/article/model";
import { useGameSearch } from "@/src/lib/entities/game/model";
import { filesAPI } from "@/src/lib/shared/api/files.api";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import {
  Field,
  TextareaField,
  TextField,
  UploadButton,
} from "@/src/lib/shared/ui/Fields";
import { modal } from "@/src/lib/shared/ui/Modal";
import { IRichEditorHandle, RichEditor } from "@/src/lib/shared/ui/RichEditor";
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ArticleEditor.module.scss";

interface IArticleEditorProps {
  article?: IArticle;
}

interface IDraftGame {
  _id: string;
  name: string;
  meta?: string;
}

interface IDraft {
  type: IArticleType;
  title: string;
  summary: string;
  image: string | null;
  content: string;
  game: IDraftGame | null;
}

type IErrors = Partial<Record<keyof IDraft | "gameId", string>>;

const TYPES: { type: IArticleType; label: string }[] = [
  { type: "news", label: "Site news" },
  { type: "game", label: "Game article" },
];

const toDraft = (article?: IArticle): IDraft => ({
  type: article?.type ?? "news",
  title: article?.title ?? "",
  summary: article?.summary ?? "",
  image: article?.image ?? null,
  content: article?.content ?? "",
  game: article?.game
    ? {
        _id: article.game._id,
        name: article.game.name,
        meta: article.game.year ? String(article.game.year) : undefined,
      }
    : null,
});

export const ArticleEditor: FC<IArticleEditorProps> = ({ article }) => {
  const router = useRouter();
  const editorRef = useRef<IRichEditorHandle>(null);
  const [draft, setDraft] = useState<IDraft>(() => toDraft(article));
  const [errors, setErrors] = useState<IErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const gameSearch = useGameSearch(draft.type === "game" && !draft.game);
  const { mutate: save, isPending } = useSaveArticleMutation();
  const { mutateAsync: removeArticle } = useDeleteArticleMutation();
  const isPublished = article?.status === "published";

  const set =
    <K extends keyof IDraft>(key: K) =>
    (value: IDraft[K]) =>
      setDraft((current) => ({ ...current, [key]: value }));

  const uploadImage = (file: File) => {
    setIsUploading(true);
    filesAPI
      .uploadCommentImage(file)
      .then(({ data }) => set("image")(data))
      .catch(() => undefined)
      .finally(() => setIsUploading(false));
  };

  const submit = async (status: IArticleStatus) => {
    const content = (await editorRef.current?.flushUploads()) ?? draft.content;
    const parsed = SaveArticleRequestSchema.safeParse({
      type: draft.type,
      status,
      title: draft.title,
      summary: draft.summary,
      image: draft.image,
      content,
      gameId: draft.type === "game" ? (draft.game?._id ?? null) : null,
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ])
        )
      );

      return;
    }

    setErrors({});
    save(
      { id: article?._id, dto: parsed.data },
      {
        onSuccess: async (saved) => {
          toast.success({
            description:
              status === "draft"
                ? isPublished
                  ? "Post unpublished"
                  : "Draft saved"
                : isPublished
                  ? "Post updated"
                  : "Post published",
          });
          await revalidateArticlePage(article?.slug, saved.slug);

          if (!article) router.replace(`/admin/news/${saved._id}`);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!article) return;

    const modalId = `delete-article-${article._id}`;

    modal.open(
      <ConfirmModal
        title="Delete post"
        message={
          <>
            Delete <strong>{article.title}</strong>?
          </>
        }
        warning="The post disappears from the feed and its link stops working."
        onConfirm={async () => {
          await removeArticle(article._id);
          modal.close(modalId);
          toast.success({ description: "Post deleted" });
          await revalidateArticlePage(article.slug);
          router.push("/admin/news");
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  return (
    <div className={styles.editor}>
      <Field label="Kind of post">
        <Tabs
          theme="segmented"
          ariaLabel="Kind of post"
          defaultTabIndex={TYPES.findIndex((item) => item.type === draft.type)}
          isUseDefaultIndex
          contents={TYPES.map((item) => ({
            tabName: item.label,
            onTabClick: () => set("type")(item.type),
          }))}
        />
      </Field>

      {draft.type === "game" &&
        (draft.game ? (
          <Field label="Game" error={errors.gameId}>
            <div className={styles.editor__game}>
              <Chip
                onRemove={() => set("game")(null)}
                removeLabel={`Remove ${draft.game.name}`}
              >
                {[draft.game.name, draft.game.meta].filter(Boolean).join(" · ")}
              </Chip>
            </div>
          </Field>
        ) : (
          <div className={styles.editor__picker}>
            <SearchPicker
              label="Game"
              placeholder="Search the game this article is about"
              search={gameSearch.search}
              onSearch={gameSearch.setSearch}
              options={gameSearch.options}
              isLoading={gameSearch.isLoading}
              onPick={(option) => {
                set("game")({
                  _id: option.id,
                  name: option.label,
                  meta: option.meta,
                });
                gameSearch.setSearch("");
              }}
            />
            {errors.gameId && (
              <p className={styles.editor__error}>{errors.gameId}</p>
            )}
          </div>
        ))}

      <TextField
        label="Title"
        value={draft.title}
        onChange={set("title")}
        maxLength={ARTICLE_TITLE_MAX}
        error={errors.title}
      />

      <TextareaField
        label={`Summary (${draft.summary.length} / ${ARTICLE_SUMMARY_MAX})`}
        value={draft.summary}
        onChange={set("summary")}
        rows={2}
        placeholder="Shown in the feed and in link previews"
        error={errors.summary}
      />

      <Field label="Image" error={errors.image}>
        <div className={styles.editor__image}>
          {draft.image && (
            <div className={styles.editor__preview}>
              <Image src={draft.image} alt="" fill sizes="240px" />
            </div>
          )}
          <div className={styles.editor__imageActions}>
            <UploadButton
              label={draft.image ? "Replace image" : "Upload image"}
              fileName={null}
              disabled={isUploading}
              onFile={uploadImage}
            />
            {draft.image && (
              <Button
                type="button"
                color={ButtonColor.TRANSPARENT}
                onClick={() => set("image")(null)}
              >
                Remove image
              </Button>
            )}
          </div>
          <p className={styles.editor__hint}>
            {draft.type === "game"
              ? "Without an image the post uses the game's artwork."
              : "Without an image the feed shows the MoonCellar mark."}
          </p>
        </div>
      </Field>

      <Field label="Text" error={errors.content}>
        <RichEditor
          ref={editorRef}
          value={draft.content}
          onChange={set("content")}
          limit={ARTICLE_TEXT_LIMIT}
          placeholder="Write the post…"
        />
      </Field>

      <footer className={styles.editor__footer}>
        <div className={styles.editor__status}>
          <Badge tone={isPublished ? "positive" : "attention"} isWithDot>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          {article && (
            <span>
              {isPublished
                ? `Published ${formatArticleDate(article.publishedAt)}`
                : `Saved ${formatArticleDate(article.updatedAt)}`}
            </span>
          )}
          {isPublished && article && (
            <Button
              href={getArticleHref(article.slug)}
              color={ButtonColor.TRANSPARENT}
              isAccentText
              compact
            >
              View post
            </Button>
          )}
        </div>
        <div className={styles.editor__buttons}>
          {article && (
            <Button
              type="button"
              color={ButtonColor.RED}
              disabled={isPending}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            disabled={isPending || isUploading}
            onClick={() => submit("draft")}
          >
            {isPublished ? "Unpublish" : "Save draft"}
          </Button>
          <Button
            type="button"
            color={ButtonColor.ACCENT}
            isLoading={isPending}
            disabled={isUploading}
            onClick={() => submit("published")}
          >
            {isPublished ? "Save changes" : "Publish"}
          </Button>
        </div>
      </footer>
    </div>
  );
};
