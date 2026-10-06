import { FC, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { modal } from "@/src/lib/shared/ui/Modal";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  useRaConnectMutation,
  useRaDisconnectMutation,
  useRaSyncMutation,
  useRaVerifyMutation,
} from "../../model/useRaAccount";
import styles from "./RaAccount.module.scss";

const DISCONNECT_RA_MODAL_ID = "disconnect-ra";
const RA_SETTINGS_URL = "https://retroachievements.org/settings";

export const RaAccount: FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const connect = useRaConnectMutation();
  const verify = useRaVerifyMutation();
  const sync = useRaSyncMutation();
  const disconnect = useRaDisconnectMutation();
  const isBusy =
    connect.isPending ||
    verify.isPending ||
    sync.isPending ||
    disconnect.isPending;

  const [username, setUsername] = useState(profile?.raUsername ?? "");
  const [isChanging, setIsChanging] = useState(false);
  const [openedAt] = useState(Date.now);

  const pending =
    profile?.raPending &&
    new Date(profile.raPending.expiresAt).getTime() > openedAt
      ? profile.raPending
      : null;
  const isVerified = !!profile?.raVerifiedAt && !!profile.raUsername;

  const handleConnect = () =>
    connect.mutate(username.trim(), {
      onSuccess: () => setIsChanging(false),
    });

  const handleVerify = () =>
    verify.mutate(undefined, {
      onSuccess: ({ username }) =>
        toast.success({
          title: "RetroAchievements connected",
          description: username,
        }),
    });

  const handleSync = () =>
    sync.mutate(undefined, {
      onSuccess: ({ awards }) =>
        toast.success({
          title: "RetroAchievements updated",
          description: `${awards} ${commonUtils.addLastS("award", awards)}`,
        }),
    });

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success({ description: "Code copied" });
    } catch {
      toast.error({ description: "Copy the code by hand" });
    }
  };

  const handleDisconnect = () =>
    modal.open(
      <ConfirmModal
        title="Disconnect RetroAchievements"
        message={`Disconnect ${profile?.raUsername}? Your awards stop showing on MoonCellar.`}
        onCancel={() => modal.close(DISCONNECT_RA_MODAL_ID)}
        onConfirm={async () => {
          await disconnect.mutateAsync();
          modal.close(DISCONNECT_RA_MODAL_ID);
          setUsername("");
          toast.success({ description: "RetroAchievements disconnected" });
        }}
      />,
      { id: DISCONNECT_RA_MODAL_ID }
    );

  if (isVerified && !pending && !isChanging) {
    return (
      <div className={styles.ra}>
        <div className={styles.ra__account}>
          {!!profile.raUserPic && (
            <Image
              src={profile.raUserPic}
              alt=""
              width={40}
              height={40}
              className={styles.ra__avatar}
            />
          )}
          <span className={styles.ra__note}>
            Connected to{" "}
            <a
              href={`https://retroachievements.org/user/${profile.raUsername}`}
              target="_blank"
              rel="noreferrer"
            >
              {profile.raUsername}
            </a>
            {`, ${profile.raAwards?.length ?? 0} ${commonUtils.addLastS("award", profile.raAwards?.length ?? 0)}`}
            {profile.raSyncedAt
              ? `, updated ${commonUtils.getHumanDate(profile.raSyncedAt)}.`
              : "."}
          </span>
        </div>
        <div className={styles.ra__actions}>
          <Button
            type="button"
            onClick={handleSync}
            disabled={isBusy}
            isLoading={sync.isPending}
          >
            Update awards
          </Button>
          <Button
            type="button"
            onClick={() => setIsChanging(true)}
            disabled={isBusy}
          >
            Change account
          </Button>
          <Button
            type="button"
            color={ButtonColor.RED}
            onClick={handleDisconnect}
            disabled={isBusy}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  if (pending && !isChanging) {
    return (
      <div className={styles.ra}>
        <span className={styles.ra__note}>
          To prove that <b>{pending.username}</b> is yours, paste this code into
          the Motto field in your{" "}
          <a href={RA_SETTINGS_URL} target="_blank" rel="noreferrer">
            RetroAchievements settings
          </a>
          , save it, then press Verify. You can remove the code afterwards.
        </span>
        <div className={styles.ra__code}>
          <code>{pending.code}</code>
          <Button
            type="button"
            compact
            onClick={() => handleCopy(pending.code)}
          >
            Copy
          </Button>
        </div>
        <span className={styles.ra__hint}>
          The code works until{" "}
          {new Date(pending.expiresAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </span>
        <div className={styles.ra__actions}>
          <Button
            type="button"
            color={ButtonColor.ACCENT}
            onClick={handleVerify}
            disabled={isBusy}
            isLoading={verify.isPending}
          >
            Verify
          </Button>
          <Button
            type="button"
            onClick={() => setIsChanging(true)}
            disabled={isBusy}
          >
            Use another username
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ra}>
      <span className={styles.ra__note}>
        {profile?.raUsername && !isVerified
          ? `${profile.raUsername} was added without a check. Connect it again to confirm the account is yours.`
          : "Connect your RetroAchievements account to show your mastered and beaten games. You will be asked to put a short code into your RetroAchievements motto."}
      </span>
      <TextField
        label="RetroAchievements username"
        value={username}
        disabled={isBusy}
        onChange={setUsername}
        isFlush
        action={
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isBusy || username.trim().length < 2}
            isLoading={connect.isPending}
          >
            Get code
          </Button>
        }
      />
      {isChanging && (
        <Button
          type="button"
          color={ButtonColor.GHOST}
          className={styles.ra__back}
          onClick={() => setIsChanging(false)}
          disabled={isBusy}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};
