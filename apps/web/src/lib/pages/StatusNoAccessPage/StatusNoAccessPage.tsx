"use client";

import { FC } from "react";
import { FRONT_URL } from "@/src/lib/shared/constants";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SvgLock } from "@/src/lib/shared/ui/svg";
import styles from "./StatusNoAccessPage.module.scss";

interface IStatusNoAccessPageProps {
  viewer: { id: string; userName: string };
}

export const StatusNoAccessPage: FC<IStatusNoAccessPageProps> = ({
  viewer,
}) => {
  const { logout } = useAuth();

  return (
    <Box>
      <div className={styles.page}>
        <EmptyState
          variant="page"
          as="h1"
          icon={<SvgLock size="40" />}
          title="No access"
          description={
            <>
              Status is open to MoonCellar admins. You are signed in as{" "}
              <strong>{viewer.userName}</strong>.
            </>
          }
          action={
            <>
              <Button
                color={ButtonColor.DEFAULT}
                onClick={() => logout(viewer.id)}
              >
                Sign out
              </Button>
              <Button color={ButtonColor.TRANSPARENT} href={FRONT_URL}>
                Go to MoonCellar
              </Button>
            </>
          }
        />
      </div>
    </Box>
  );
};
