import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ICommentsSort,
  IReviewCategory,
  IReviewsResponse,
  IReviewsSort,
} from "@mooncellar/schemas";
import { commentsAPI } from "@/src/lib/shared/api";
import { commentQueryKeys } from "./comment.query-keys";

interface IPage<T> {
  results: T[];
  total: number;
}

const getNextPageParam = <T>(lastPage: IPage<T>, pages: IPage<T>[]) =>
  pages.reduce((count, page) => count + page.results.length, 0) <
  lastPage.total
    ? pages.length + 1
    : undefined;

export const flattenPages = <T extends { _id: string }>(
  pages?: { results: T[] }[]
) => {
  const seen = new Set<string>();

  return (pages ?? [])
    .flatMap((page) => page.results)
    .filter((item) => {
      if (seen.has(item._id)) return false;

      seen.add(item._id);

      return true;
    });
};

export const useReviewsQuery = (
  gameId: string,
  sort: IReviewsSort,
  category?: IReviewCategory,
  initialData?: IReviewsResponse
) =>
  useInfiniteQuery({
    queryKey: commentQueryKeys.reviewsList(gameId, sort, category),
    queryFn: ({ pageParam }) =>
      commentsAPI
        .getReviews(gameId, { sort, category, page: pageParam })
        .then(({ data }) => data),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 60000,
    initialData: initialData
      ? { pages: [initialData], pageParams: [1] }
      : undefined,
    initialDataUpdatedAt: 0,
  });

export const useCommentsQuery = (
  gameId: string,
  sort: ICommentsSort,
  enabled = true
) =>
  useInfiniteQuery({
    queryKey: commentQueryKeys.discussionList(gameId, sort),
    queryFn: ({ pageParam }) =>
      commentsAPI
        .getComments(gameId, { sort, page: pageParam })
        .then(({ data }) => data),
    initialPageParam: 1,
    getNextPageParam,
    enabled: enabled && !!gameId,
    staleTime: 60000,
  });

export const useRepliesQuery = (commentId: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: commentQueryKeys.repliesList(commentId),
    queryFn: ({ pageParam }) =>
      commentsAPI
        .getReplies(commentId, { page: pageParam })
        .then(({ data }) => data),
    initialPageParam: 1,
    getNextPageParam,
    enabled: enabled && !!commentId,
    staleTime: 60000,
  });
