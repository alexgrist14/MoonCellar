import { FC } from "react";
import classNames from "classnames";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "./ActivityTimeline.module.scss";

const COUNT = 12;

export const ActivityTimelineSkeleton: FC = () => (
  <div className={styles.body} aria-hidden>
    <ol className={styles.grid}>
      {Array.from({ length: COUNT }, (_, index) => (
        <li key={index} className={styles.entry}>
          <Skeleton
            aspectRatio="var(--cover-ratio)"
            radius="var(--radius-x2)"
          />
          <div className={classNames(styles.content, styles.content_skeleton)}>
            <div className={styles.title}>
              <Skeleton shape="text" width="60%" />
            </div>
            <div className={styles.line}>
              <Skeleton shape="text" width="40%" />
            </div>
            <div className={styles.foot}>
              <Skeleton shape="text" width="30%" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  </div>
);
