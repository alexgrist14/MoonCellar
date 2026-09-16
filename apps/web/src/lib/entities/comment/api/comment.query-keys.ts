import {
  ICommentsSort,
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
  discussion: (gameId: string) =>
    [...commentQueryKeys.all, "discussion", gameId] as const,
  discussionList: (gameId: string, sort: ICommentsSort) =>
    [...commentQueryKeys.discussion(gameId), sort] as const,
  replies: () => [...commentQueryKeys.all, "replies"] as const,
  repliesList: (commentId: string) =>
    [...commentQueryKeys.replies(), commentId] as const,
};
