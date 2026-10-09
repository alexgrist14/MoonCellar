import { FC } from "react";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";

export const EntrySkeleton: FC<{ count?: number }> = ({ count = 3 }) => (
  <div className={styles.feed} role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={styles.entry}>
        <Skeleton shape="circle" width="var(--community-avatar-size)" />
        <div className={styles.entry__main}>
          <Skeleton shape="text" width="30%" />
          <Skeleton shape="text" count={2} />
        </div>
      </div>
    ))}
  </div>
);

export const ReplySkeleton: FC = () => (
  <div className={styles.reply} role="status" aria-label="Loading">
    <Skeleton shape="circle" width="var(--community-reply-avatar-size)" />
    <div className={styles.entry__main}>
      <Skeleton shape="text" width="30%" />
      <Skeleton shape="text" />
    </div>
  </div>
);
