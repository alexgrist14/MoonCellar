import {
  InfiniteData,
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  IComment,
  ICommentsResponse,
  ICreateCommentRequest,
  IReview,
  IReviewsResponse,
  IUpdateCommentRequest,
} from "@mooncellar/schemas";
import { commentsAPI } from "@/src/lib/shared/api";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { commentQueryKeys } from "./comment.query-keys";

const updateReviewPages = (
  data: InfiniteData<IReviewsResponse, number> | undefined,
  reviewId: string,
  update: (review: IReview) => IReview
) =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      results: page.results.map((review) =>
        review._id === reviewId ? update(review) : review
      ),
    })),
  };

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

const setCommentInCache = (
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

const invalidateDiscussion = (queryClient: QueryClient, gameId: string) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: commentQueryKeys.discussion(gameId),
    }),
    queryClient.invalidateQueries({ queryKey: commentQueryKeys.replies() }),
  ]);

export const useReviewHelpfulMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  const setReview = (reviewId: string, update: (review: IReview) => IReview) =>
    queryClient.setQueriesData<InfiniteData<IReviewsResponse, number>>(
      { queryKey: commentQueryKeys.reviews(gameId) },
      (data) => updateReviewPages(data, reviewId, update)
    );

  return useMutation({
    mutationFn: ({
      reviewId,
      isHelpful,
    }: {
      reviewId: string;
      isHelpful: boolean;
    }) =>
      commentsAPI
        .setReviewHelpful(reviewId, isHelpful)
        .then(({ data }) => data),
    onMutate: ({ reviewId, isHelpful }) =>
      setReview(reviewId, (review) => ({
        ...review,
        isHelpful,
        helpfulCount: Math.max(0, review.helpfulCount + (isHelpful ? 1 : -1)),
      })),
    onSuccess: (vote, { reviewId }) =>
      setReview(reviewId, (review) => ({
        ...review,
        isHelpful: vote.isActive,
        helpfulCount: vote.count,
      })),
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.reviews(gameId),
      }),
  });
};

export const useCommentLikeMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      isLiked,
    }: {
      commentId: string;
      isLiked: boolean;
    }) => commentsAPI.setLike(commentId, isLiked).then(({ data }) => data),
    onMutate: ({ commentId, isLiked }) =>
      setCommentInCache(queryClient, gameId, commentId, (comment) => ({
        ...comment,
        isLiked,
        likesCount: Math.max(0, comment.likesCount + (isLiked ? 1 : -1)),
      })),
    onSuccess: (vote, { commentId }) =>
      setCommentInCache(queryClient, gameId, commentId, (comment) => ({
        ...comment,
        isLiked: vote.isActive,
        likesCount: vote.count,
      })),
    onError: () => invalidateDiscussion(queryClient, gameId),
  });
};

export const useCreateCommentMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateCommentRequest) =>
      commentsAPI.create(data).then(({ data }) => data),
    onSuccess: (comment) => {
      if (!comment.parentId) {
        return queryClient.invalidateQueries({
          queryKey: commentQueryKeys.discussion(gameId),
        });
      }

      setCommentInCache(queryClient, gameId, comment.parentId, (parent) => ({
        ...parent,
        repliesCount: parent.repliesCount + 1,
      }));

      return queryClient.invalidateQueries({
        queryKey: commentQueryKeys.repliesList(comment.parentId),
      });
    },
  });
};

export const useUpdateCommentMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: IUpdateCommentRequest;
    }) => commentsAPI.update(commentId, data).then(({ data }) => data),
    onSuccess: (comment) =>
      setCommentInCache(queryClient, gameId, comment._id, () => comment),
  });
};

export const useDeleteCommentMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      commentsAPI.remove(commentId).then(({ data }) => data),
    onSuccess: () => invalidateDiscussion(queryClient, gameId),
  });
};

export const useReportCommentMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      commentsAPI.report(commentId).then(({ data }) => data),
    onSuccess: (_result, commentId) => {
      setCommentInCache(queryClient, gameId, commentId, (comment) => ({
        ...comment,
        isReported: true,
      }));
      toast.success({ description: "Reported. A moderator will review it." });
    },
  });
};

export const useCommentStatusMutation = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      status,
    }: {
      commentId: string;
      status: "visible" | "hidden";
    }) =>
      commentsAPI.updateStatus(commentId, { status }).then(({ data }) => data),
    onSuccess: () => invalidateDiscussion(queryClient, gameId),
  });
};
