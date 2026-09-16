import { FC, useEffect, useState } from "react";
import {
  COMMENT_REPORTS_PAGE_SIZE,
  ICommentReportAction,
  ICommentReportGroup,
  ICommentReportStatus,
} from "@mooncellar/schemas";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { SortToggle } from "@/src/lib/shared/ui/SortToggle";
import { useCommentReportsQuery } from "@/src/lib/entities/comment/api/comment-reports.queries";
import { useResolveCommentReportMutation } from "@/src/lib/entities/comment/api/comment-reports.mutations";
import { ReportCard } from "./ReportCard";
import styles from "./ReportList.module.scss";

const STATUS_OPTIONS: { value: ICommentReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

const SUCCESS_MESSAGES: Record<ICommentReportAction, string> = {
  hide: "The comment was hidden and its reports closed.",
  delete: "The comment was deleted and its reports closed.",
  dismiss: "The reports were dismissed, the comment stays.",
};

const ReportList: FC = () => {
  const [status, setStatus] = useState<ICommentReportStatus>("open");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useCommentReportsQuery(status, page);
  const {
    mutate: resolve,
    isPending: isResolving,
    variables,
  } = useResolveCommentReportMutation();

  const isLoaderShown = useMinimumLoading(isLoading);
  const reports = data?.results ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!isFetching && page > 1 && !!data && !data.results.length) {
      setPage((current) => current - 1);
    }
  }, [data, isFetching, page]);

  const changeStatus = (next: ICommentReportStatus) => {
    setStatus(next);
    setPage(1);
  };

  const runAction = (
    report: ICommentReportGroup,
    action: ICommentReportAction
  ) =>
    resolve(
      { commentId: report.commentId, action },
      {
        onSuccess: () =>
          toast.success({ description: SUCCESS_MESSAGES[action] }),
      }
    );

  const handleResolve = (
    report: ICommentReportGroup,
    action: ICommentReportAction
  ) => {
    if (action !== "delete") {
      runAction(report, action);
      return;
    }

    const modalId = `delete-reported-comment-${report.commentId}`;

    modal.open(
      <ConfirmModal
        title="Delete comment"
        message={
          <>
            Delete this comment by{" "}
            <strong>
              {report.comment?.author?.userName ?? "an unknown author"}
            </strong>
            ?
          </>
        }
        warning="The text is removed for good. Replies to it stay visible."
        onConfirm={() => {
          modal.close(modalId);
          runAction(report, action);
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  return (
    <div className={styles.reports}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {data &&
            `${total} ${status === "open" ? "open" : "resolved"} ${
              total === 1 ? "case" : "cases"
            }`}
        </span>
        <SortToggle
          label="Report status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={changeStatus}
        />
      </div>

      {isLoaderShown ? (
        <div className={styles.loading}>
          <Loader type="pulse" />
        </div>
      ) : !reports.length ? (
        <p className={styles.placeholder}>
          {status === "open"
            ? "No open reports. Nothing waits for a decision."
            : "No reports have been resolved yet."}
        </p>
      ) : (
        <ul className={styles.list}>
          {reports.map((report) => (
            <ReportCard
              key={`${report.commentId}-${report.resolvedAt ?? "open"}`}
              report={report}
              isBusy={isResolving && variables?.commentId === report.commentId}
              onResolve={(action) => handleResolve(report, action)}
            />
          ))}
        </ul>
      )}

      <Pagination
        take={COMMENT_REPORTS_PAGE_SIZE}
        total={total}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
      />
    </div>
  );
};

export default ReportList;
