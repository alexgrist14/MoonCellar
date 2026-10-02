export const notificationQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationQueryKeys.all, "list"] as const,
  list: (isUnread: boolean) =>
    [...notificationQueryKeys.lists(), { isUnread }] as const,
  unread: () => [...notificationQueryKeys.all, "unread"] as const,
  pushKey: () => ["notifications-push-key"] as const,
};
