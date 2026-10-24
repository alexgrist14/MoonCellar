import {
  getCommentTargetKey,
  ICommentsSort,
  ICommentTarget,
  IGetUserReviewsRequest,
  IReviewCategory,
  IReviewsSort,
} from "@mooncellar/schemas";

export const commentQueryKeys = {
  all: ["comments"] as const,
  reviews: (gameId: string) =>
    [...commentQueryKeys.all, "reviews", gameId] as const,
  reviewsList: (
    gameId: string,
    sort: IReviewsSort,
    category?: IReviewCategory
  ) => [...commentQueryKeys.reviews(gameId), sort, category ?? "all"] as const,
  userReviews: (userId: string) =>
    [...commentQueryKeys.all, "user-reviews", userId] as const,
  userReviewsList: (userId: string, params: IGetUserReviewsRequest) =>
    [...commentQueryKeys.userReviews(userId), params] as const,
  discussion: (target: ICommentTarget) =>
    [
      ...commentQueryKeys.all,
      "discussion",
      getCommentTargetKey(target),
    ] as const,
  discussionList: (target: ICommentTarget, sort: ICommentsSort) =>
    [...commentQueryKeys.discussion(target), sort] as const,
  replies: () => [...commentQueryKeys.all, "replies"] as const,
  repliesList: (commentId: string) =>
    [...commentQueryKeys.replies(), commentId] as const,
};
