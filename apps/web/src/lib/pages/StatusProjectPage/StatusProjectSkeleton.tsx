"use client";

import { FC } from "react";
import { Box } from "@/src/lib/shared/ui/Box";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import styles from "./StatusProjectPage.module.scss";

export const StatusProjectSkeleton: FC = () => (
  <>
    <Box>
      <div className={styles.head}>
        <Skeleton shape="text" width="40%" height="32px" />
        <Skeleton shape="text" width="24%" />
      </div>
    </Box>
    <Box>
      <Skeleton height="320px" />
    </Box>
  </>
);
