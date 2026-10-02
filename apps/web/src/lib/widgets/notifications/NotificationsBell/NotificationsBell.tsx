import { FC, useCallback, useRef, useState } from "react";
import {
  useMarkNotificationsReadMutation,
  useUnreadNotificationsQuery,
} from "@/src/lib/entities/notification/api";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { SvgBell } from "@/src/lib/shared/ui/svg";
import { NotificationsFeed } from "../NotificationsFeed";
import styles from "./NotificationsBell.module.scss";

const MAX_SHOWN_COUNT = 99;

export const NotificationsBell: FC = () => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsQuery();
  const { mutate: markRead } = useMarkNotificationsReadMutation();

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <Button
        ref={anchorRef}
        className={styles.trigger}
        color={ButtonColor.TRANSPARENT}
        tooltip="Notifications"
        aria-label={
          unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <SvgBell size="20" />
        {!!unreadCount && (
          <span className={styles.count}>
            {unreadCount > MAX_SHOWN_COUNT
              ? `${MAX_SHOWN_COUNT}+`
              : unreadCount}
          </span>
        )}
      </Button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={close}
        align="end"
        width="380px"
        title="Notifications"
        classNameContent={styles.panel}
      >
        <div className={styles.panel__list}>
          {isOpen && <NotificationsFeed isFreshOnly onItemOpen={close} />}
        </div>
        <div className={styles.panel__footer}>
          <Button
            color={ButtonColor.TRANSPARENT}
            disabled={!unreadCount}
            onClick={() => markRead({ all: true })}
          >
            Mark all as read
          </Button>
          <Button
            href="/notifications"
            color={ButtonColor.DEFAULT}
            onClick={close}
          >
            View all
          </Button>
        </div>
      </Popover>
    </>
  );
};
