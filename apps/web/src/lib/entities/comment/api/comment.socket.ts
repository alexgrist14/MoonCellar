import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CommentsSocketEvent,
  ICommentCreatedEvent,
  ICommentLikesEvent,
  ICommentStatusEvent,
  ICommentTarget,
  ICommentUpdatedEvent,
  isCommentOfTarget,
} from "@mooncellar/schemas";
import {
  followDiscussion,
  getCommentsSocket,
} from "@/src/lib/shared/socket/comments.socket";
import { invalidateDiscussion, setCommentInCache } from "./comment.cache";
import { commentQueryKeys } from "./comment.query-keys";

export const useDiscussionSocket = (
  { type, id }: ICommentTarget,
  enabled = true
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id || !enabled) return;

    const target: ICommentTarget = { type, id };
    const socket = getCommentsSocket();

    const setRepliesCount = (
      parentId: string | null,
      repliesCount: number | null
    ) => {
      if (!parentId || repliesCount === null) return;

      setCommentInCache(queryClient, target, parentId, (parent) => ({
        ...parent,
        repliesCount,
      }));
    };

    const onCreated = (event: ICommentCreatedEvent) => {
      if (!isCommentOfTarget(event, target)) return;

      if (!event.parentId) {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.discussion(target),
        });
        return;
      }

      setRepliesCount(event.parentId, event.parentRepliesCount);
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.repliesList(event.parentId),
      });
    };

    const onUpdated = (event: ICommentUpdatedEvent) => {
      if (!isCommentOfTarget(event, target)) return;

      setCommentInCache(queryClient, target, event.commentId, (comment) => ({
        ...comment,
        body: event.body,
        isSpoiler: event.isSpoiler,
        updatedAt: event.updatedAt,
      }));
    };

    const onStatus = (event: ICommentStatusEvent) => {
      if (!isCommentOfTarget(event, target)) return;

      setRepliesCount(event.parentId, event.parentRepliesCount);
      invalidateDiscussion(queryClient, target);
    };

    const onLikes = (event: ICommentLikesEvent) => {
      if (!isCommentOfTarget(event, target)) return;

      setCommentInCache(queryClient, target, event.commentId, (comment) => ({
        ...comment,
        likesCount: event.likesCount,
      }));
    };

    const onReconnect = () => invalidateDiscussion(queryClient, target);

    socket.on(CommentsSocketEvent.COMMENT_CREATED, onCreated);
    socket.on(CommentsSocketEvent.COMMENT_UPDATED, onUpdated);
    socket.on(CommentsSocketEvent.COMMENT_STATUS, onStatus);
    socket.on(CommentsSocketEvent.COMMENT_LIKES, onLikes);
    socket.io.on("reconnect", onReconnect);

    const unfollow = followDiscussion(target);

    return () => {
      unfollow();
      socket.off(CommentsSocketEvent.COMMENT_CREATED, onCreated);
      socket.off(CommentsSocketEvent.COMMENT_UPDATED, onUpdated);
      socket.off(CommentsSocketEvent.COMMENT_STATUS, onStatus);
      socket.off(CommentsSocketEvent.COMMENT_LIKES, onLikes);
      socket.io.off("reconnect", onReconnect);
    };
  }, [type, id, enabled, queryClient]);
};
