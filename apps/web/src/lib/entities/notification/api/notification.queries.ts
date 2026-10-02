import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/src/lib/shared/api";
import { notificationQueryKeys } from "./notification.query-keys";

export const useNotificationsQuery = (isUnread = false, enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationQueryKeys.list(isUnread),
    queryFn: ({ pageParam }) =>
      notificationsApi
        .getList({
          before: pageParam,
          unread: isUnread ? "true" : undefined,
        })
        .then(({ data }) => data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

export const useUnreadNotificationsQuery = (enabled = true) =>
  useQuery({
    queryKey: notificationQueryKeys.unread(),
    queryFn: () =>
      notificationsApi.getUnreadCount().then(({ data }) => data.unreadCount),
    enabled,
  });
