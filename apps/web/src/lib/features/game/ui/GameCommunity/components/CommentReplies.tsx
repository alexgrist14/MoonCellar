import { FC } from "react";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  flattenPages,
  useRepliesQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";
import { CommentItem } from "./CommentItem";

interface ICommentRepliesProps {
  commentId: string;
  gameId: string;
}

export const CommentReplies: FC<ICommentRepliesProps> = ({
  commentId,
  gameId,
}) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useRepliesQuery(commentId);

  const isLoaderShown = useMinimumLoading(isLoading);
  const replies = flattenPages(data?.pages);

  if (isLoaderShown) {
    return <Loader type="pulse" isBlock />;
  }

  return (
    <>
      {replies.map((reply) => (
        <CommentItem key={reply._id} comment={reply} gameId={gameId} isReply />
      ))}
      {hasNextPage && (
        <Button
          type="button"
          color={ButtonColor.GHOST}
          compact
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
