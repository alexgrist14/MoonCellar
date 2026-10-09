import { FC } from "react";
import classNames from "classnames";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "./ListCheckRow.module.scss";

export const ListCheckRowSkeleton: FC<{ count?: number }> = ({ count = 4 }) => (
  <div role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={classNames(styles.row, styles.row_skeleton)}>
        <Skeleton shape="circle" width="var(--padding-x5)" />
        <Skeleton shape="text" width="60%" />
      </div>
    ))}
  </div>
);
