"use client";

import { FC } from "react";
import { FRONT_URL } from "@/src/lib/shared/constants";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { STATUS_SIGN_IN_PATH } from "@/src/lib/shared/utils/status-path.utils";
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
    <div className={styles.page}>
      <Box wrapperStyle={{ width: "var(--status-card-width)" }}>
        <EmptyState
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
                onClick={() => logout(viewer.id, { href: STATUS_SIGN_IN_PATH })}
              >
                Sign out
              </Button>
              <Button color={ButtonColor.TRANSPARENT} href={FRONT_URL}>
                Go to MoonCellar
              </Button>
            </>
          }
        />
      </Box>
    </div>
  );
};
