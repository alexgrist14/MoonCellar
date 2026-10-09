import { FC } from "react";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import {
  flattenPages,
  useRepliesQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import { CommentItem } from "./CommentItem";
import { ReplySkeleton } from "./EntrySkeleton";

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
    return <ReplySkeleton />;
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
          isAccentText
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          Show more replies
        </Button>
      )}
    </>
  );
};
