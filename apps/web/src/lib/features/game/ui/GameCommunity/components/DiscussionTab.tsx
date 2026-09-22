import { FC, useEffect, useState } from "react";
import { ICommentsSort, IGameResponse, IReview } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  flattenPages,
  useCommentsQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import { useCreateCommentMutation } from "@/src/lib/entities/comment/api/comment.mutations";
import { useDiscussionSocket } from "@/src/lib/entities/comment/api/comment.socket";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";
import { getPlainTextExcerpt } from "@/src/lib/features/game/ui/GameCommunity/utils";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";
import { CommentQuote } from "./CommentQuote";
import { Tabs } from "@/src/lib/shared/ui/Tabs";

interface IDiscussionTabProps {
  game: IGameResponse;
  discussedReview?: IReview;
  onClearReview: () => void;
  onTotal: (total: number) => void;
}

const sortOptions: { value: ICommentsSort; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
];

const REVIEW_EXCERPT_LENGTH = 160;

export const DiscussionTab: FC<IDiscussionTabProps> = ({
  game,
  discussedReview,
  onClearReview,
  onTotal,
}) => {
  const [sort, setSort] = useState<ICommentsSort>("top");

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCommentsQuery(game._id, sort);
  const { mutateAsync: createComment } = useCreateCommentMutation(game._id);

  useDiscussionSocket(game._id);

  const isLoaderShown = useMinimumLoading(isLoading);
  const comments = flattenPages(data?.pages);
  const total = data?.pages[0]?.total;
  const reviewAuthor = discussedReview?.author?.userName ?? "a player";

  useEffect(() => {
    if (total !== undefined) onTotal(total);
  }, [total, onTotal]);

  return (
    <div className={styles.tab}>
      <CommentComposer
        key={discussedReview?._id ?? game._id}
        submitLabel="Post"
        pendingLabel="Posting…"
        placeholder={
          discussedReview
            ? "What do you think about this review?"
            : "Ask about a boss, a route or a build…"
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
                <button
                  type="button"
                  className={styles.action}
                  aria-label="Stop discussing this review"
                  onClick={onClearReview}
                >
                  <SvgClose size="16" style={{ color: "inherit" }} />
                </button>
              }
            />
          )
        }
        onSubmit={(body, isSpoiler) =>
          createComment({
            gameId: game._id,
            body,
            isSpoiler,
            ...(!!discussedReview && { reviewId: discussedReview._id }),
          }).then(onClearReview)
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
        <div className={styles.loading}>
          <Loader type="pulse" />
        </div>
      ) : !comments.length ? (
        <p className={styles.placeholder}>
          No discussion yet. Start it with a question or a tip.
        </p>
      ) : (
        <div className={styles.feed}>
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} gameId={game._id} />
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
