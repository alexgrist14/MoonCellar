import { FC, useState } from "react";
import classNames from "classnames";
import { IComment } from "@mooncellar/schemas";
import { RichText } from "@/src/lib/shared/ui/RichText/RichText";
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  SvgComment,
  SvgFlag,
  SvgHeart,
  SvgReply,
} from "@/src/lib/shared/ui/svg";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  useCommentLikeMutation,
  useCommentStatusMutation,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useReportCommentMutation,
  useUpdateCommentMutation,
} from "@/src/lib/entities/comment/api/comment.mutations";
import styles from "../GameCommunity.module.scss";
import { useRequireAuth } from "../useRequireAuth";
import { getPlainTextExcerpt } from "../utils";
import { AuthorName, CommunityAvatar } from "./CommunityAuthor";
import { AuthorStatus } from "./AuthorStatus";
import { CommentComposer } from "./CommentComposer";
import { CommentQuote } from "./CommentQuote";
import { CommentReplies } from "./CommentReplies";

interface ICommentItemProps {
  comment: IComment;
  gameId: string;
  isReply?: boolean;
}

const REPLY_EXCERPT_LENGTH = 140;

export const CommentItem: FC<ICommentItemProps> = ({
  comment,
  gameId,
  isReply,
}) => {
  const profile = useAuthStore((state) => state.profile);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const requireAuth = useRequireAuth();

  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: setLike } = useCommentLikeMutation(gameId);
  const { mutateAsync: createComment } = useCreateCommentMutation(gameId);
  const { mutateAsync: updateComment } = useUpdateCommentMutation(gameId);
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteCommentMutation(gameId);
  const { mutate: reportComment } = useReportCommentMutation(gameId);
  const { mutate: setStatus, isPending: isChangingStatus } =
    useCommentStatusMutation(gameId);

  const isBusy = useMinimumLoading(isDeleting || isChangingStatus);

  const isOwn = !!profile && profile._id === comment.userId;
  const isVisible = comment.status === "visible";
  const isReadable = !!comment.body;
  const isReplyToReply =
    !!comment.replyToId && comment.replyToId !== comment.parentId;
  const authorName = comment.author?.userName ?? "a player";

  const toggleLike = () =>
    requireAuth((viewer) => {
      if (viewer._id === comment.userId) {
        toast.error({
          title: "Not available",
          description: "You can't like your own comment",
        });
        return;
      }

      setLike({ commentId: comment._id, isLiked: !comment.isLiked });
    });

  const confirmDelete = () => {
    const modalId = `delete-comment-${comment._id}`;

    modal.open(
      <ConfirmModal
        title="Delete comment"
        message="Delete this comment? Replies to it stay visible."
        onConfirm={() => {
          modal.close(modalId);
          deleteComment(comment._id);
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  const replyComposer = isReplying && (
    <CommentComposer
      submitLabel="Reply"
      pendingLabel="Sending…"
      placeholder="Write a reply…"
      context={
        <CommentQuote
          label={
            <>
              Replying to <b>{authorName}</b>
            </>
          }
          text={getPlainTextExcerpt(comment.body, REPLY_EXCERPT_LENGTH)}
        />
      }
      onCancel={() => setIsReplying(false)}
      onSubmit={(body, isSpoiler) =>
        createComment({
          gameId,
          parentId: comment._id,
          body,
          isSpoiler,
        }).then(() => {
          setIsReplying(false);
          setIsRepliesOpen(true);
        })
      }
    />
  );

  return (
    <article
      className={classNames(isReply ? styles.reply : styles.entry, {
        [styles.busy]: isBusy,
      })}
      aria-busy={isBusy}
    >
      {isBusy && <Loader type="pulse" className={styles.busy__loader} />}
      <CommunityAvatar
        author={isReadable ? comment.author : null}
        isSmall={isReply}
      />
      <div className={styles.entry__main}>
        {!isReadable ? (
          <p className={styles.removed}>
            {comment.status === "deleted"
              ? "This comment was deleted."
              : "This comment was hidden by a moderator."}
          </p>
        ) : (
          <>
            <div className={styles.entry__head}>
              <AuthorName author={comment.author} />
              {!!comment.authorPlaythrough && (
                <AuthorStatus
                  category={comment.authorPlaythrough.category}
                  time={comment.authorPlaythrough.time}
                  isMastered={comment.authorPlaythrough.isMastered}
                />
              )}
              {isReplyToReply && (
                <span className={styles.replyTo}>
                  <SvgReply size="12" style={{ color: "inherit" }} />
                  to{" "}
                  <b>
                    {comment.replyTo?.author?.userName ?? "a removed comment"}
                  </b>
                </span>
              )}
              <time
                dateTime={comment.createdAt}
                className={styles.entry__meta}
                suppressHydrationWarning
              >
                {commonUtils.getHumanDate(comment.createdAt)}
              </time>
              {comment.status === "hidden" && (
                <span className={styles.badge}>Hidden</span>
              )}
              {isAdmin && !!comment.reportsCount && (
                <span className={styles.badge}>
                  {comment.reportsCount}{" "}
                  {comment.reportsCount === 1 ? "report" : "reports"}
                </span>
              )}
            </div>
            {!!comment.reviewId && (
              <CommentQuote
                label={
                  comment.review ? (
                    <>
                      On <b>{comment.review.author?.userName ?? "a player"}</b>
                      &apos;s review ·{" "}
                      {commonUtils.upFL(comment.review.category)}
                      {comment.review.rating !== null &&
                        ` · ${comment.review.rating} / 10`}
                    </>
                  ) : (
                    "On a review that is no longer public"
                  )
                }
                text={comment.review?.excerpt}
              />
            )}
            {isEditing ? (
              <CommentComposer
                submitLabel="Save"
                pendingLabel="Saving…"
                placeholder="Edit your comment…"
                initialBody={comment.body}
                initialSpoiler={comment.isSpoiler}
                onCancel={() => setIsEditing(false)}
                onSubmit={(body, isSpoiler) =>
                  updateComment({
                    commentId: comment._id,
                    data: { body, isSpoiler },
                  }).then(() => setIsEditing(false))
                }
              />
            ) : (
              <Spoiler isActive={comment.isSpoiler}>
                <RichText
                  content={comment.body}
                  className={styles.entry__body}
                />
              </Spoiler>
            )}
            <div className={styles.entry__actions}>
              {isVisible && (
                <button
                  type="button"
                  aria-pressed={comment.isLiked}
                  aria-label="Like"
                  className={classNames(styles.action, {
                    [styles.action_active]: comment.isLiked,
                  })}
                  onClick={toggleLike}
                >
                  <SvgHeart size="16" style={{ color: "inherit" }} />
                  <span className={styles.action__count}>
                    {comment.likesCount}
                  </span>
                </button>
              )}
              {isVisible && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => requireAuth(() => setIsReplying(true))}
                >
                  <SvgReply size="16" style={{ color: "inherit" }} />
                  Reply
                </button>
              )}
              {isOwn && isVisible && !isEditing && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
              {(isOwn || isAdmin) && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              )}
              {!!profile &&
                !isOwn &&
                isVisible &&
                (comment.isReported ? (
                  <span className={styles.entry__meta}>Reported</span>
                ) : (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => reportComment(comment._id)}
                  >
                    <SvgFlag size="16" style={{ color: "inherit" }} />
                    Report
                  </button>
                ))}
              {isAdmin && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() =>
                    setStatus({
                      commentId: comment._id,
                      status: isVisible ? "hidden" : "visible",
                    })
                  }
                >
                  {isVisible ? "Hide" : "Restore"}
                </button>
              )}
            </div>
          </>
        )}
        {isReply && replyComposer}
        {!isReply &&
          (!!comment.repliesCount || isReplying || isRepliesOpen) && (
            <div className={styles.thread}>
              {replyComposer}
              {isRepliesOpen ? (
                <CommentReplies commentId={comment._id} gameId={gameId} />
              ) : (
                !!comment.repliesCount && (
                  <button
                    type="button"
                    className={classNames(styles.action, styles.action_link)}
                    onClick={() => setIsRepliesOpen(true)}
                  >
                    <SvgComment size="16" style={{ color: "inherit" }} />
                    {comment.repliesCount}{" "}
                    {comment.repliesCount === 1 ? "reply" : "replies"}
                  </button>
                )
              )}
            </div>
          )}
      </div>
    </article>
  );
};
