import { FC } from "react";
import classNames from "classnames";
import { Box } from "@/src/lib/shared/ui/Box";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "./UserNavigation.module.scss";

const ROWS = 6;
const LABEL_WIDTHS = [
  "var(--padding-x10)",
  "var(--padding-x16)",
  "var(--padding-x20)",
  "var(--padding-x14)",
];

export const UserNavigationSkeleton: FC = () => (
  <div className={styles.panel}>
    <Box classNameContent={styles.identity}>
      <div className={classNames(styles.btn, styles.row)}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <Skeleton height="100%" radius="var(--radius-x1)" />
          </div>
          <Skeleton shape="text" width="var(--padding-x20)" />
        </div>
      </div>
    </Box>
    <Box>
      {Array.from({ length: ROWS }, (_, index) => (
        <div key={index} className={styles.row}>
          <Skeleton
            shape="text"
            width={LABEL_WIDTHS[index % LABEL_WIDTHS.length]}
          />
          <Skeleton shape="text" width="var(--padding-x6)" />
        </div>
      ))}
    </Box>
  </div>
);
