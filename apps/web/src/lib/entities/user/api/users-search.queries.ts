import { useInfiniteQuery } from "@tanstack/react-query";
import { USERS_SEARCH_PAGE_SIZE } from "@mooncellar/schemas";
import { userAPI } from "@/src/lib/shared/api";
import { userQueryKeys } from "./user.query-keys";

export const useUsersSearchQuery = (q: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: userQueryKeys.search(q),
    queryFn: ({ pageParam }) =>
      userAPI
        .searchUsers({ q, page: pageParam, take: USERS_SEARCH_PAGE_SIZE })
        .then(({ data }) => data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      pages.length * USERS_SEARCH_PAGE_SIZE < lastPage.total
        ? pages.length + 1
        : undefined,
    enabled: enabled && q.trim().length >= 2,
    staleTime: 60000,
  });
