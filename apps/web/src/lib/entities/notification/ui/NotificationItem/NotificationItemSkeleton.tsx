import { FC } from "react";
import classNames from "classnames";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "./NotificationItem.module.scss";

export const NotificationItemSkeleton: FC = () => (
  <div className={classNames(styles.item, styles.item_skeleton)}>
    <div className={styles.item__main}>
      <Skeleton shape="circle" width="var(--notification-avatar-size)" />
      <span className={styles.item__info}>
        <Skeleton shape="text" count={2} gap="var(--gap-x1)" />
        <Skeleton shape="text" width="20%" />
      </span>
    </div>
  </div>
);
