import { FC, useEffect, useState } from "react";
import {
  COMMENT_REPORTS_PAGE_SIZE,
  IAdminComment,
  ICommentStatus,
} from "@mooncellar/schemas";
import { ModeratedComment } from "@/src/lib/entities/comment/ui/ModeratedComment";
import { useAdminCommentsQuery } from "@/src/lib/entities/comment/api/comment-reports.queries";
import {
  IAdminCommentAction,
  useAdminCommentActionMutation,
} from "@/src/lib/entities/comment/api/comment-reports.mutations";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { pluralize } from "@/src/lib/shared/utils/plural.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./CommentList.module.scss";

const STATUS_OPTIONS: { value?: ICommentStatus; label: string }[] = [
  { label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "deleted", label: "Deleted" },
];

const SUCCESS_MESSAGES: Record<IAdminCommentAction, string> = {
  hide: "The comment was hidden.",
  restore: "The comment is visible again.",
  delete: "The comment was deleted.",
};

export const CommentList: FC = () => {
  const [status, setStatus] = useState<ICommentStatus>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useAdminCommentsQuery(status, page);
  const {
    mutate,
    isPending: isActing,
    variables,
  } = useAdminCommentActionMutation();

  const isLoaderShown = useMinimumLoading(isLoading);
  const comments = data?.results ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!isFetching && page > 1 && !!data && !data.results.length) {
      setPage((current) => current - 1);
    }
  }, [data, isFetching, page]);

  const runAction = (comment: IAdminComment, action: IAdminCommentAction) =>
    mutate(
      { commentId: comment._id, action },
      {
        onSuccess: () =>
          toast.success({ description: SUCCESS_MESSAGES[action] }),
      }
    );

  const handleDelete = (comment: IAdminComment) => {
    const modalId = `delete-comment-${comment._id}`;

    modal.open(
      <ConfirmModal
        title="Delete comment"
        message={
          <>
            Delete this comment by{" "}
            <strong>{comment.author?.userName ?? "an unknown author"}</strong>?
          </>
        }
        warning="The text is removed for good. Replies to it stay visible."
        onConfirm={() => {
          modal.close(modalId);
          runAction(comment, "delete");
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  return (
    <div className={styles.comments}>
      <div className={styles.toolbar}>
        <Tabs
          theme="segmented"
          ariaLabel="Comment status"
          contents={STATUS_OPTIONS.map((option) => ({
            tabName: option.label,
            onTabClick: () => {
              setStatus(option.value);
              setPage(1);
            },
          }))}
          defaultTabIndex={STATUS_OPTIONS.findIndex(
            (option) => option.value === status
          )}
          isUseDefaultIndex
        />
        <span className={styles.count}>
          {data && pluralize(total, "comment")}
        </span>
      </div>

      {isLoaderShown ? (
        <div role="status" aria-label="Loading">
          <Skeleton
            count={3}
            height="var(--community-loading-height)"
            radius="var(--radius-x4)"
            gap="var(--gap-x3)"
          />
        </div>
      ) : !comments.length ? (
        <EmptyState title="No comments here." />
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => {
            const isBusy = isActing && variables?.commentId === comment._id;

            return (
              <ModeratedComment
                key={comment._id}
                comment={comment}
                isBusy={isBusy}
                meta={
                  comment.reportsCount
                    ? pluralize(comment.reportsCount, "open report")
                    : undefined
                }
              >
                {comment.status !== "deleted" && (
                  <div className={styles.actions}>
                    {comment.status === "visible" ? (
                      <Button
                        color={ButtonColor.ACCENT}
                        disabled={isBusy}
                        onClick={() => runAction(comment, "hide")}
                      >
                        Hide
                      </Button>
                    ) : (
                      <Button
                        color={ButtonColor.DEFAULT}
                        disabled={isBusy}
                        onClick={() => runAction(comment, "restore")}
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      color={ButtonColor.RED}
                      disabled={isBusy}
                      onClick={() => handleDelete(comment)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </ModeratedComment>
            );
          })}
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
