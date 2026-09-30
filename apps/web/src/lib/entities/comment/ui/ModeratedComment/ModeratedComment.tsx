import { FC, ReactNode } from "react";
import Link from "next/link";
import classNames from "classnames";
import { ICommentStatus, IReportedComment } from "@mooncellar/schemas";
import { RichText } from "@/src/lib/shared/ui/RichText";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./ModeratedComment.module.scss";

interface IModeratedCommentProps {
  comment: IReportedComment | null;
  meta?: ReactNode;
  isBusy?: boolean;
  children?: ReactNode;
}

const STATUS_LABELS: Record<ICommentStatus, string> = {
  visible: "Visible",
  hidden: "Hidden",
  deleted: "Deleted",
};

export const ModeratedComment: FC<IModeratedCommentProps> = ({
  comment,
  meta,
  isBusy,
  children,
}) => (
  <li className={classNames(styles.card, { [styles.card_busy]: isBusy })}>
    <div className={styles.card__head}>
      <div className={styles.card__context}>
        {comment?.game ? (
          <Link href={`/games/${comment.game.slug}`} target="_blank">
            {comment.game.name}
          </Link>
        ) : (
          <span>Unknown game</span>
        )}
        {comment?.isReply && <span className={styles.badge}>Reply</span>}
        {comment?.isOnReview && (
          <span className={styles.badge}>On a review</span>
        )}
        {!!comment && (
          <span
            className={classNames(styles.badge, {
              [styles.badge_attention]: comment.status !== "visible",
            })}
          >
            {STATUS_LABELS[comment.status]}
          </span>
        )}
      </div>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>

    {comment ? (
      <div className={styles.card__comment}>
        <div className={styles.card__author}>
          {comment.author ? (
            <Link href={`/user/${comment.author.userName}`} target="_blank">
              {comment.author.userName}
            </Link>
          ) : (
            <span>Unknown author</span>
          )}
          <time dateTime={comment.createdAt} suppressHydrationWarning>
            {commonUtils.getHumanDate(comment.createdAt)}
          </time>
          {comment.isSpoiler && <span className={styles.badge}>Spoiler</span>}
        </div>
        {comment.body ? (
          <RichText content={comment.body} className={styles.card__body} />
        ) : (
          <p className={styles.removed}>
            The comment was deleted and its text is gone.
          </p>
        )}
      </div>
    ) : (
      <p className={styles.removed}>This comment no longer exists.</p>
    )}

    {children}
  </li>
);
