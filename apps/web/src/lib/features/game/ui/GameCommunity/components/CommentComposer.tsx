import { FC, ReactNode, useId, useRef, useState } from "react";
import classNames from "classnames";
import { COMMENT_TEXT_LIMIT } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { IRichEditorHandle, RichEditor } from "@/src/lib/shared/ui/RichEditor";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";
import { useRequireAuth } from "@/src/lib/features/game/ui/GameCommunity/useRequireAuth";

interface ICommentComposerProps {
  submitLabel: string;
  pendingLabel: string;
  placeholder: string;
  initialBody?: string;
  initialSpoiler?: boolean;
  context?: ReactNode;
  onSubmit: (body: string, isSpoiler: boolean) => Promise<unknown>;
  onCancel?: () => void;
}

const hasContent = (html: string) =>
  html.includes("<img") || !!html.replace(/<[^>]*>/g, "").trim();

export const CommentComposer: FC<ICommentComposerProps> = ({
  submitLabel,
  pendingLabel,
  placeholder,
  initialBody = "",
  initialSpoiler = false,
  context,
  onSubmit,
  onCancel,
}) => {
  const spoilerId = useId();
  const profile = useAuthStore((state) => state.profile);
  const requireAuth = useRequireAuth();
  const editorRef = useRef<IRichEditorHandle>(null);

  const [body, setBody] = useState(initialBody);
  const [isSpoiler, setIsSpoiler] = useState(initialSpoiler);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const isPosting = useMinimumLoading(isSubmitting);

  if (!profile) {
    return (
      <Button
        color={ButtonColor.DEFAULT}
        className={styles.composer__signIn}
        onClick={() => requireAuth(() => undefined)}
      >
        Sign in to join the discussion
      </Button>
    );
  }

  const submit = async () => {
    if (!hasContent(body) || isSubmitting) return;

    setIsSubmitting(true);

    let html = body;

    try {
      if (editorRef.current) html = await editorRef.current.flushUploads();
    } catch {
      toast.error({
        title: "Upload failed",
        description: "The images could not be uploaded, nothing was posted.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(html, isSpoiler);
      setBody("");
      setIsSpoiler(false);
      setEditorKey((key) => key + 1);
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={classNames(styles.composer, { [styles.busy]: isPosting })}
      aria-busy={isPosting}
    >
      {isPosting && <Loader type="pulse" className={styles.busy__loader} />}
      {context}
      <RichEditor
        key={editorKey}
        ref={editorRef}
        value={body}
        onChange={setBody}
        placeholder={placeholder}
        limit={COMMENT_TEXT_LIMIT}
      />
      <div className={styles.composer__footer}>
        <label className={styles.composer__spoiler} htmlFor={spoilerId}>
          <Checkbox
            id={spoilerId}
            checked={isSpoiler}
            onChange={(event) => setIsSpoiler(event.target.checked)}
          />
          Contains spoilers
        </label>
        <div className={styles.composer__buttons}>
          {!!onCancel && (
            <Button color={ButtonColor.TRANSPARENT} onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            color={ButtonColor.ACCENT}
            disabled={!hasContent(body) || isSubmitting}
            onClick={submit}
          >
            {isPosting ? pendingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
