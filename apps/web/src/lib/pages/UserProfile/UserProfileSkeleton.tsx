"use client";

import { FC } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { Box } from "@/src/lib/shared/ui/Box";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { UserInfoSkeleton } from "@/src/lib/widgets/user/UserInfo";
import { UserNavigationSkeleton } from "@/src/lib/features/user/ui/UserNavigation";
import styles from "./UserProfile.module.scss";

export const UserProfileSkeleton: FC = () => {
  const isProfileTab = useSelectedLayoutSegments().every((part) =>
    part.startsWith("(")
  );

  return (
    <div className={styles.container} role="status" aria-label="Loading">
      <Box classNameContent={styles.content}>
        {isProfileTab ? (
          <UserInfoSkeleton />
        ) : (
          <>
            <Skeleton
              shape="text"
              width="var(--page-skeleton-crumbs-width)"
              className={styles.crumbs}
            />
            <Skeleton
              height="var(--page-height-available)"
              radius="var(--radius-x4)"
            />
          </>
        )}
      </Box>
      <div className={styles.navigation}>
        <UserNavigationSkeleton />
      </div>
    </div>
  );
};
