import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IMarkNotificationsReadRequest } from "@mooncellar/schemas";
import { notificationsApi } from "@/src/lib/shared/api";
import { notificationQueryKeys } from "./notification.query-keys";

const useApplyUnreadCount = () => {
  const queryClient = useQueryClient();

  return (unreadCount: number) => {
    queryClient.setQueryData(notificationQueryKeys.unread(), unreadCount);
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
  };
};

export const useMarkNotificationsReadMutation = () => {
  const applyUnreadCount = useApplyUnreadCount();

  return useMutation({
    mutationFn: (body: IMarkNotificationsReadRequest) =>
      notificationsApi.markRead(body).then(({ data }) => data.unreadCount),
    onSuccess: applyUnreadCount,
  });
};

export const useRemoveNotificationMutation = () => {
  const applyUnreadCount = useApplyUnreadCount();

  return useMutation({
    mutationFn: (id: string) =>
      notificationsApi.remove(id).then(({ data }) => data.unreadCount),
    onSuccess: applyUnreadCount,
  });
};
