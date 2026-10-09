import { FC } from "react";
import styles from "./PageSkeleton.module.scss";
import { Skeleton } from "../Skeleton";

export const PageSkeleton: FC = () => (
  <div className={styles.page} role="status" aria-label="Loading">
    <Skeleton shape="text" width="var(--page-skeleton-crumbs-width)" />
    <Skeleton
      width="var(--page-skeleton-title-width)"
      height="var(--padding-x8)"
    />
    <Skeleton radius="var(--radius-x5)" className={styles.page__content} />
  </div>
);
