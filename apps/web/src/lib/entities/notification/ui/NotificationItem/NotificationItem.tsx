import { FC } from "react";
import Link from "next/link";
import classNames from "classnames";
import {
  getNotificationHref,
  getNotificationText,
  INotification,
  SYSTEM_USER_AVATAR,
  SYSTEM_USER_NAME,
} from "@mooncellar/schemas";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./NotificationItem.module.scss";

const SYSTEM_ACTOR = {
  _id: SYSTEM_USER_NAME,
  userName: SYSTEM_USER_NAME,
  avatar: SYSTEM_USER_AVATAR,
};

interface INotificationItemProps {
  notification: INotification;
  viewerName?: string;
  onOpen?: (notification: INotification) => void;
  onRemove?: (notification: INotification) => void;
}

export const NotificationItem: FC<INotificationItemProps> = ({
  notification,
  viewerName,
  onOpen,
  onRemove,
}) => {
  const { actors, action, subject } = getNotificationText(notification);
  const href = getNotificationHref(notification, viewerName);
  const body = (
    <>
      <span className={styles.item__avatar}>
        <Avatar
          user={
            notification.actors[0]
              ? {
                  ...notification.actors[0],
                  avatar: notification.actors[0].avatar ?? "",
                }
              : !notification.actorsCount
                ? SYSTEM_ACTOR
                : undefined
          }
          isWithoutTooltip
          isWithoutHover
        />
      </span>
      <span className={styles.item__info}>
        <span className={styles.item__text}>
          {actors && <b>{actors} </b>}
          {action}
          {subject && <b> {subject}</b>}
        </span>
        {notification.payload.reason && (
          <span className={styles.item__reason}>
            {notification.payload.reason}
          </span>
        )}
        <span className={styles.item__time}>
          {commonUtils.getHumanDate(notification.updatedAt)}
        </span>
      </span>
    </>
  );

  return (
    <div
      className={classNames(styles.item, {
        [styles.item_unread]: !notification.isRead,
      })}
    >
      {href ? (
        <Link
          href={href}
          className={styles.item__main}
          onClick={() => onOpen?.(notification)}
        >
          {body}
        </Link>
      ) : (
        <div className={styles.item__main}>{body}</div>
      )}
      {onRemove && (
        <Button
          className={styles.item__remove}
          color={ButtonColor.TRANSPARENT}
          isOnlyIcon
          tooltip="Remove"
          aria-label="Remove notification"
          onClick={() => onRemove(notification)}
        >
          <SvgClose size="16" />
        </Button>
      )}
    </div>
  );
};
