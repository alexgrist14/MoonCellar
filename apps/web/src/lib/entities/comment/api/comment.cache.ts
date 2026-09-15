import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { IComment, ICommentsResponse } from "@mooncellar/schemas";
import { commentQueryKeys } from "./comment.query-keys";

const updateCommentPages = (
  data: InfiniteData<ICommentsResponse, number> | undefined,
  commentId: string,
  update: (comment: IComment) => IComment
) =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      results: page.results.map((comment) =>
        comment._id === commentId ? update(comment) : comment
      ),
    })),
  };

export const setCommentInCache = (
  queryClient: QueryClient,
  gameId: string,
  commentId: string,
  update: (comment: IComment) => IComment
) => {
  [commentQueryKeys.discussion(gameId), commentQueryKeys.replies()].forEach(
    (queryKey) =>
      queryClient.setQueriesData<InfiniteData<ICommentsResponse, number>>(
        { queryKey },
        (data) => updateCommentPages(data, commentId, update)
      )
  );
};

export const invalidateDiscussion = (queryClient: QueryClient, gameId: string) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: commentQueryKeys.discussion(gameId),
    }),
    queryClient.invalidateQueries({ queryKey: commentQueryKeys.replies() }),
  ]);
