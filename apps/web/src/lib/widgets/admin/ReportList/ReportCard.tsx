import { FC } from "react";
import Link from "next/link";
import classNames from "classnames";
import {
  ICommentReportAction,
  ICommentReportGroup,
  ICommentReportResolution,
  ICommentStatus,
} from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { RichText } from "@/src/lib/shared/ui/RichText";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./ReportList.module.scss";

interface IReportCardProps {
  report: ICommentReportGroup;
  isBusy: boolean;
  onResolve: (action: ICommentReportAction) => void;
}

const STATUS_LABELS: Record<ICommentStatus, string> = {
  visible: "Visible",
  hidden: "Hidden",
  deleted: "Deleted",
};

const RESOLUTION_LABELS: Record<ICommentReportResolution, string> = {
  hidden: "Hidden",
  deleted: "Deleted",
  dismissed: "Kept, reports dismissed",
};

const pluralize = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

export const ReportCard: FC<IReportCardProps> = ({
  report,
  isBusy,
  onResolve,
}) => {
  const { comment, resolution } = report;
  const isOpen = !resolution;
  const hiddenReporters = report.reportsCount - report.reporters.length;
  const isResolvedByAuthor =
    !!report.resolvedBy &&
    report.resolvedBy._id === comment?.author?._id;

  return (
    <li className={classNames(styles.card, { [styles.busy]: isBusy })}>
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
        <span className={styles.meta}>
          {pluralize(report.reportsCount, "report")} · last{" "}
          {commonUtils.getHumanDate(report.lastReportedAt)}
        </span>
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

      <p className={styles.meta}>
        Reported by{" "}
        {report.reporters.map((reporter) => reporter.userName).join(", ") ||
          "unknown users"}
        {hiddenReporters > 0 && ` and ${hiddenReporters} more`}
      </p>

      {isOpen ? (
        <div className={styles.card__actions}>
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isBusy}
            onClick={() => onResolve("dismiss")}
          >
            Keep
          </Button>
          {comment?.status === "visible" && (
            <Button
              color={ButtonColor.ACCENT}
              disabled={isBusy}
              onClick={() => onResolve("hide")}
            >
              Hide
            </Button>
          )}
          {!!comment && comment.status !== "deleted" && (
            <Button
              color={ButtonColor.RED}
              disabled={isBusy}
              onClick={() => onResolve("delete")}
            >
              Delete
            </Button>
          )}
        </div>
      ) : (
        <p className={styles.meta}>
          {RESOLUTION_LABELS[resolution]}{" "}
          {isResolvedByAuthor
            ? "by its author"
            : `by ${report.resolvedBy?.userName ?? "an unknown user"}`}
          {!!report.resolvedAt &&
            ` · ${commonUtils.getHumanDate(report.resolvedAt)}`}
        </p>
      )}
    </li>
  );
};
