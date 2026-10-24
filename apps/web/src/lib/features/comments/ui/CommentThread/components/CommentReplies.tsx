import { FC } from "react";
import { ICommentTarget } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  flattenPages,
  useRepliesQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import styles from "@/src/lib/features/comments/ui/CommentThread/CommentThread.module.scss";
import { CommentItem } from "./CommentItem";
import { ReplySkeleton } from "./EntrySkeleton";

interface ICommentRepliesProps {
  commentId: string;
  target: ICommentTarget;
}

export const CommentReplies: FC<ICommentRepliesProps> = ({
  commentId,
  target,
}) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useRepliesQuery(commentId);

  const isLoaderShown = useMinimumLoading(isLoading);
  const replies = flattenPages(data?.pages);

  if (isLoaderShown) {
    return <ReplySkeleton />;
  }

  return (
    <>
      {replies.map((reply) => (
        <CommentItem key={reply._id} comment={reply} target={target} isReply />
      ))}
      {hasNextPage && (
        <Button
          type="button"
          color={ButtonColor.GHOST}
          compact
          isAccentText
          className={styles.threadAction}
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          Show more replies
        </Button>
      )}
    </>
  );
};
