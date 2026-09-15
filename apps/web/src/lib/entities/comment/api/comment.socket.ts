import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CommentsSocketEvent,
  ICommentCreatedEvent,
  ICommentLikesEvent,
  ICommentStatusEvent,
  ICommentUpdatedEvent,
} from "@mooncellar/schemas";
import {
  followDiscussion,
  getCommentsSocket,
} from "@/src/lib/shared/socket/comments.socket";
import { invalidateDiscussion, setCommentInCache } from "./comment.cache";
import { commentQueryKeys } from "./comment.query-keys";

export const useDiscussionSocket = (gameId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    const socket = getCommentsSocket();

    const setRepliesCount = (
      parentId: string | null,
      repliesCount: number | null
    ) => {
      if (!parentId || repliesCount === null) return;

      setCommentInCache(queryClient, gameId, parentId, (parent) => ({
        ...parent,
        repliesCount,
      }));
    };

    const onCreated = (event: ICommentCreatedEvent) => {
      if (event.gameId !== gameId) return;

      if (!event.parentId) {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.discussion(gameId),
        });
        return;
      }

      setRepliesCount(event.parentId, event.parentRepliesCount);
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.repliesList(event.parentId),
      });
    };

    const onUpdated = (event: ICommentUpdatedEvent) => {
      if (event.gameId !== gameId) return;

      setCommentInCache(queryClient, gameId, event.commentId, (comment) => ({
        ...comment,
        body: event.body,
        isSpoiler: event.isSpoiler,
        updatedAt: event.updatedAt,
      }));
    };

    const onStatus = (event: ICommentStatusEvent) => {
      if (event.gameId !== gameId) return;

      setRepliesCount(event.parentId, event.parentRepliesCount);
      invalidateDiscussion(queryClient, gameId);
    };

    const onLikes = (event: ICommentLikesEvent) => {
      if (event.gameId !== gameId) return;

      setCommentInCache(queryClient, gameId, event.commentId, (comment) => ({
        ...comment,
        likesCount: event.likesCount,
      }));
    };

    const onReconnect = () => invalidateDiscussion(queryClient, gameId);

    socket.on(CommentsSocketEvent.COMMENT_CREATED, onCreated);
    socket.on(CommentsSocketEvent.COMMENT_UPDATED, onUpdated);
    socket.on(CommentsSocketEvent.COMMENT_STATUS, onStatus);
    socket.on(CommentsSocketEvent.COMMENT_LIKES, onLikes);
    socket.io.on("reconnect", onReconnect);

    const unfollow = followDiscussion(gameId);

    return () => {
      unfollow();
      socket.off(CommentsSocketEvent.COMMENT_CREATED, onCreated);
      socket.off(CommentsSocketEvent.COMMENT_UPDATED, onUpdated);
      socket.off(CommentsSocketEvent.COMMENT_STATUS, onStatus);
      socket.off(CommentsSocketEvent.COMMENT_LIKES, onLikes);
      socket.io.off("reconnect", onReconnect);
    };
  }, [gameId, queryClient]);
};
