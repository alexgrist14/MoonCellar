import { FC, useCallback } from "react";
import { INotification } from "@mooncellar/schemas";
import {
  useMarkNotificationsReadMutation,
  useNotificationsQuery,
  useRemoveNotificationMutation,
} from "@/src/lib/entities/notification/api";
import { NotificationItem } from "@/src/lib/entities/notification/ui/NotificationItem";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import styles from "./NotificationsFeed.module.scss";

const FRESH_LOADER_DURATION = 400;

interface INotificationsFeedProps {
  isUnread?: boolean;
  isPaged?: boolean;
  isFreshOnly?: boolean;
  onItemOpen?: () => void;
}

export const NotificationsFeed: FC<INotificationsFeedProps> = ({
  isUnread = false,
  isPaged = false,
  isFreshOnly = false,
  onItemOpen,
}) => {
  const viewerName = useAuthStore((state) => state.profile?.userName);
  const {
    data,
    isLoading,
    isFetchedAfterMount,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotificationsQuery(isUnread);
  const isLoaderShown = useMinimumLoading(
    isLoading || (isFreshOnly && !isFetchedAfterMount),
    FRESH_LOADER_DURATION
  );
  const { mutate: markRead } = useMarkNotificationsReadMutation();
  const { mutate: remove } = useRemoveNotificationMutation();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const openItem = useCallback(
    (notification: INotification) => {
      if (!notification.isRead) markRead({ ids: [notification._id] });
      onItemOpen?.();
    },
    [markRead, onItemOpen]
  );

  const removeItem = useCallback(
    (notification: INotification) => remove(notification._id),
    [remove]
  );

  if (isLoaderShown) return <Loader />;

  if (!items.length) {
    return (
      <EmptyState
        variant="compact"
        title={isUnread ? "No unread notifications" : "No notifications yet"}
        description="Replies, likes and new followers will show up here."
      />
    );
  }

  return (
    <div className={styles.feed}>
      {items.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          viewerName={viewerName}
          onOpen={openItem}
          onRemove={isPaged ? removeItem : undefined}
        />
      ))}
      {isPaged && hasNextPage && (
        <Button
          color={ButtonColor.DEFAULT}
          isLoading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          Show more
        </Button>
      )}
    </div>
  );
};
