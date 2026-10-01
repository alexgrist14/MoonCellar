import { FC } from "react";
import {
  ICommentReportAction,
  ICommentReportGroup,
  ICommentReportResolution,
} from "@mooncellar/schemas";
import { ModeratedComment } from "@/src/lib/entities/comment/ui/ModeratedComment";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { pluralize } from "@/src/lib/shared/utils/plural.utils";
import styles from "./ReportList.module.scss";

interface IReportCardProps {
  report: ICommentReportGroup;
  isBusy: boolean;
  onResolve: (action: ICommentReportAction) => void;
}

const RESOLUTION_LABELS: Record<ICommentReportResolution, string> = {
  hidden: "Hidden",
  deleted: "Deleted",
  dismissed: "Kept, reports dismissed",
};

export const ReportCard: FC<IReportCardProps> = ({
  report,
  isBusy,
  onResolve,
}) => {
  const { comment, resolution } = report;
  const isOpen = !resolution;
  const hiddenReporters = report.reportsCount - report.reporters.length;
  const isResolvedByAuthor =
    !!report.resolvedBy && report.resolvedBy._id === comment?.author?._id;

  return (
    <ModeratedComment
      comment={comment}
      isBusy={isBusy}
      meta={`${pluralize(report.reportsCount, "report")} · last ${commonUtils.getHumanDate(report.lastReportedAt)}`}
    >
      <p className={styles.meta}>
        Reported by{" "}
        {report.reporters.map((reporter) => reporter.userName).join(", ") ||
          "unknown users"}
        {hiddenReporters > 0 && ` and ${hiddenReporters} more`}
      </p>

      {isOpen ? (
        <div className={styles.actions}>
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
    </ModeratedComment>
  );
};
