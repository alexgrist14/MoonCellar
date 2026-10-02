import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getNotificationHref,
  getNotificationSentence,
  SYSTEM_USER_AVATAR,
  INotificationNewEvent,
  INotificationsCountEvent,
  isAlertNotification,
  NotificationsSocketEvent,
} from "@mooncellar/schemas";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import {
  getNotificationsSocket,
  INotificationsSocket,
} from "@/src/lib/shared/socket/notifications.socket";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { isTabNotificationsOn } from "@/src/lib/shared/utils/push.utils";
import { notificationQueryKeys } from "../api/notification.query-keys";

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

export const useNotificationsSync = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) =>
    state.isAuth ? state.profile?._id : undefined
  );

  useEffect(() => {
    if (!userId) return;

    let socket: INotificationsSocket | undefined;
    let isCancelled = false;
    let isRefreshTried = false;

    const refetch = () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

    const applyCount = ({ unreadCount }: INotificationsCountEvent) => {
      queryClient.setQueryData(notificationQueryKeys.unread(), unreadCount);
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      });
    };

    const onConnect = () => {
      isRefreshTried = false;
      refetch();
    };

    const onNew = ({ notification, unreadCount }: INotificationNewEvent) => {
      applyCount({ unreadCount });

      if (!isAlertNotification(notification)) return;

      const sentence = getNotificationSentence(notification);

      if (document.hasFocus() || !isTabNotificationsOn()) {
        toast.success({ title: "New notification", description: sentence });
        return;
      }

      const href = getNotificationHref(notification);
      const browserNotification = new Notification("MoonCellar", {
        body: sentence,
        icon: SYSTEM_USER_AVATAR,
        tag: notification._id,
      });

      browserNotification.onclick = () => {
        window.focus();
        if (href) window.location.assign(href);
        browserNotification.close();
      };
    };

    const onConnectError = (error: Error) => {
      if (error.message !== UNAUTHORIZED_SOCKET_ERROR || isRefreshTried) return;

      isRefreshTried = true;

      refreshAuth().then(() => {
        if (!isCancelled && useAuthStore.getState().isAuth) socket?.connect();
      });
    };

    getNotificationsSocket()
      .then((notificationsSocket) => {
        if (isCancelled) return;

        socket = notificationsSocket;
        notificationsSocket.on("connect", onConnect);
        notificationsSocket.on(NotificationsSocketEvent.NEW, onNew);
        notificationsSocket.on(NotificationsSocketEvent.COUNT, applyCount);
        notificationsSocket.on("connect_error", onConnectError);
        notificationsSocket.connect();
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      socket?.off("connect", onConnect);
      socket?.off(NotificationsSocketEvent.NEW, onNew);
      socket?.off(NotificationsSocketEvent.COUNT, applyCount);
      socket?.off("connect_error", onConnectError);
      socket?.disconnect();
      queryClient.removeQueries({ queryKey: notificationQueryKeys.all });
    };
  }, [userId, queryClient]);
};
