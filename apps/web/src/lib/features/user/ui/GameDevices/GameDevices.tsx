import Link from "next/link";
import { FC } from "react";
import {
  useGameSessionsQuery,
  useRevokeGameSessionMutation,
} from "@/src/lib/entities/game-session/api";
import { Button } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./GameDevices.module.scss";

export const GameDevices: FC = () => {
  const { data: sessions, isLoading } = useGameSessionsQuery();
  const revoke = useRevokeGameSessionMutation();

  return (
    <div className={styles.devices}>
      <span className={styles.devices__note}>
        Games you signed in to with this account. To add one, choose Sign in in
        the game and enter its code on the <Link href="/link">link page</Link>.
      </span>
      {!isLoading && !sessions?.length && (
        <span className={styles.devices__note}>No game devices yet.</span>
      )}
      {!!sessions?.length && (
        <ul className={styles.devices__list}>
          {sessions.map((session) => (
            <li key={session.id} className={styles.devices__item}>
              <div className={styles.devices__info}>
                <span>{session.deviceName}</span>
                <span className={styles.devices__note}>
                  Last used{" "}
                  {commonUtils.formatDate(session.lastUsedAt, {
                    delimiter: ".",
                  })}
                </span>
              </div>
              <Button
                type="button"
                compact
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(session.id, {
                    onSuccess: () =>
                      toast.success({
                        description: `${session.deviceName} signed out`,
                      }),
                  })
                }
              >
                Sign out
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
