import { FC, useEffect, useRef, useState } from "react";
import {
  getCommentTargetFields,
  getCommentTargetKey,
  ICommentsSort,
  ICommentTarget,
  IReview,
} from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  flattenPages,
  useCommentsQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import { useCreateCommentMutation } from "@/src/lib/entities/comment/api/comment.mutations";
import { useDiscussionSocket } from "@/src/lib/entities/comment/api/comment.socket";
import { getPlainTextExcerpt } from "@/src/lib/features/comments/model";
import styles from "./CommentThread.module.scss";
import { CommentComposer } from "./components/CommentComposer";
import { CommentItem } from "./components/CommentItem";
import { CommentQuote } from "./components/CommentQuote";
import { EntrySkeleton } from "./components/EntrySkeleton";

interface ICommentThreadProps {
  target: ICommentTarget;
  placeholder: string;
  emptyTitle: string;
  discussedReview?: IReview;
  isDeferred?: boolean;
  onClearReview?: () => void;
  onTotal?: (total: number) => void;
}

const sortOptions: { value: ICommentsSort; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
];

const REVIEW_EXCERPT_LENGTH = 160;
const DEFERRED_ROOT_MARGIN = "400px 0px";

export const CommentThread: FC<ICommentThreadProps> = ({
  target,
  placeholder,
  emptyTitle,
  discussedReview,
  isDeferred,
  onClearReview,
  onTotal,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<ICommentsSort>("top");
  const [isReached, setIsReached] = useState(!isDeferred);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCommentsQuery(target, sort, isReached);
  const { mutateAsync: createComment } = useCreateCommentMutation(target);

  useDiscussionSocket(target, isReached);

  useEffect(() => {
    const root = rootRef.current;

    if (isReached || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setIsReached(true);
      },
      { rootMargin: DEFERRED_ROOT_MARGIN }
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, [isReached]);

  const isLoaderShown = useMinimumLoading(isLoading || !isReached);
  const comments = flattenPages(data?.pages);
  const total = data?.pages[0]?.total;
  const reviewAuthor = discussedReview?.author?.userName ?? "a player";

  useEffect(() => {
    if (total !== undefined) onTotal?.(total);
  }, [total, onTotal]);

  return (
    <div ref={rootRef} className={styles.tab}>
      <CommentComposer
        key={discussedReview?._id ?? getCommentTargetKey(target)}
        submitLabel="Post"
        pendingLabel="Posting…"
        placeholder={
          discussedReview ? "What do you think about this review?" : placeholder
        }
        context={
          !!discussedReview && (
            <CommentQuote
              label={
                <>
                  Discussing <b>{reviewAuthor}</b>&apos;s review
                </>
              }
              text={getPlainTextExcerpt(
                discussedReview.comment,
                REVIEW_EXCERPT_LENGTH
              )}
              action={
                !!onClearReview && (
                  <Button
                    type="button"
                    color={ButtonColor.GHOST}
                    compact
                    tooltip="Stop discussing this review"
                    onClick={onClearReview}
                  >
                    <SvgClose size="16" style={{ color: "inherit" }} />
                  </Button>
                )
              }
            />
          )
        }
        onSubmit={(body, isSpoiler) =>
          createComment({
            ...getCommentTargetFields(target),
            body,
            isSpoiler,
            ...(!!discussedReview && { reviewId: discussedReview._id }),
          }).then(() => onClearReview?.())
        }
      />
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {total !== undefined &&
            `${total} ${total === 1 ? "comment" : "comments"}`}
        </span>
        <Tabs
          theme="segmented"
          ariaLabel="Sort comments"
          contents={sortOptions.map((option) => ({
            tabName: option.label,
            onTabClick: () => setSort(option.value),
          }))}
          defaultTabIndex={sortOptions.findIndex(
            (option) => option.value === sort
          )}
          isUseDefaultIndex
        />
      </div>
      {isLoaderShown ? (
        <EntrySkeleton />
      ) : !comments.length ? (
        <EmptyState variant="compact" title={emptyTitle} />
      ) : (
        <div className={styles.feed}>
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} target={target} />
          ))}
        </div>
      )}
      {hasNextPage && (
        <div className={styles.footer}>
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
};
