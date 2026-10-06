import { FC, useEffect, useRef, useState } from "react";
import { ISteamSyncResponse } from "@mooncellar/schemas";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SvgSteam } from "@/src/lib/shared/ui/svg";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  useSteamLinkMutation,
  useSteamLoginMutation,
  useSteamPlaythroughsToggleMutation,
  useSteamSyncMutation,
  useSteamUnlinkMutation,
} from "../../model/useSteamAccount";
import styles from "./SteamAccount.module.scss";

const UNLINK_STEAM_MODAL_ID = "unlink-steam";

const takeOpenIdParams = () => {
  const search = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(
    [...search].filter(([key]) => key.startsWith("openid."))
  );

  if (!Object.keys(params).length) return null;

  window.history.replaceState(null, "", window.location.pathname);

  return params;
};

export const SteamAccount: FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const steam = profile?.steam;

  const login = useSteamLoginMutation();
  const link = useSteamLinkMutation();
  const sync = useSteamSyncMutation();
  const unlink = useSteamUnlinkMutation();
  const playthroughsToggle = useSteamPlaythroughsToggleMutation();
  const isBusy =
    login.isPending ||
    link.isPending ||
    sync.isPending ||
    unlink.isPending ||
    playthroughsToggle.isPending;
  const progress = steam?.achievements ?? [];
  const masteredCount = progress.filter(
    ({ unlocked, total }) => unlocked >= total
  ).length;

  const [unmatched, setUnmatched] = useState<ISteamSyncResponse["unmatched"]>(
    []
  );

  const isLinkHandled = useRef(false);
  const { mutate: linkAccount } = link;

  useEffect(() => {
    if (isLinkHandled.current) return;
    isLinkHandled.current = true;

    const params = takeOpenIdParams();

    if (!params) return;

    if (params["openid.mode"] !== "id_res") {
      toast.error({ description: "Steam sign-in was cancelled" });
      return;
    }

    linkAccount(params, {
      onSuccess: ({ matchedCount, ownedCount, unmatched }) => {
        setUnmatched(unmatched);
        toast.success({
          title: "Steam account linked",
          description: `${matchedCount} of ${ownedCount} games imported`,
        });
      },
    });
  }, [linkAccount]);

  const handleLogin = () => login.mutate();

  const handleSync = () =>
    sync.mutate(undefined, {
      onSuccess: ({ matchedCount, ownedCount, unmatched }) => {
        setUnmatched(unmatched);
        toast.success({
          title: "Steam library updated",
          description: `${matchedCount} of ${ownedCount} games imported`,
        });
      },
    });

  const handleUnlink = () =>
    modal.open(
      <ConfirmModal
        title="Unlink Steam"
        message="Unlink your Steam account? Your Steam games and achievement progress disappear from your profile."
        onCancel={() => modal.close(UNLINK_STEAM_MODAL_ID)}
        onConfirm={async () => {
          await unlink.mutateAsync();
          modal.close(UNLINK_STEAM_MODAL_ID);
          toast.success({ description: "Steam account unlinked" });
        }}
      />,
      { id: UNLINK_STEAM_MODAL_ID }
    );

  if (!steam) {
    return (
      <div className={styles.steam}>
        <span className={styles.steam__note}>
          Sign in through Steam to show your library and achievement progress on
          your profile&apos;s Steam page. It stays in sync with Steam every
          night. Your Steam profile must show game details publicly.
        </span>
        <Button
          type="button"
          className={styles.steam__button}
          onClick={handleLogin}
          disabled={isBusy}
          isLoading={link.isPending}
        >
          <SvgSteam size="16" style={{ color: "inherit" }} />
          Sign in through Steam
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.steam}>
      <span className={styles.steam__note}>
        Linked to{" "}
        <a
          href={`https://steamcommunity.com/profiles/${steam.steamId}`}
          target="_blank"
          rel="noreferrer"
        >
          Steam profile {steam.steamId}
        </a>
        {steam.syncedAt
          ? `, imported ${commonUtils.getHumanDate(steam.syncedAt)}`
          : ""}
        .
      </span>
      <span className={styles.steam__note}>
        {progress.length
          ? `Achievements in ${progress.length} ${commonUtils.addLastS("game", progress.length)}, ${masteredCount} mastered${steam.achievementsSyncedAt ? `, read ${commonUtils.getHumanDate(steam.achievementsSyncedAt)}` : ""}.`
          : "No achievement progress yet; it is read with the library and every night."}
      </span>
      <ToggleSwitch
        label="Mark playthroughs from achievements"
        hint="Each mastered game gets a Mastered playthrough. Games you already have a playthrough for are left alone, and a deleted one is not added again."
        checked={!!profile?.settings?.steamSyncPlaythroughs}
        isDisabled={isBusy}
        onChange={(isOn) =>
          playthroughsToggle.mutate(isOn, {
            onSuccess: (result) =>
              result &&
              toast.success({
                description: result.created
                  ? `${result.created} ${commonUtils.addLastS("playthrough", result.created)} added from Steam`
                  : "Playthroughs are up to date",
              }),
          })
        }
      />
      <div className={styles.steam__actions}>
        <Button
          type="button"
          onClick={handleSync}
          disabled={isBusy}
          isLoading={sync.isPending || link.isPending}
        >
          Update library
        </Button>
        <Button
          type="button"
          color={ButtonColor.RED}
          onClick={handleUnlink}
          disabled={isBusy}
        >
          Unlink
        </Button>
      </div>
      {!!unmatched.length && (
        <ActionsMenu
          label={`${unmatched.length} ${commonUtils.addLastS("game", unmatched.length)} not in the catalogue`}
          width="320px"
          searchPlaceholder="Search games"
          items={unmatched.map((game) => ({
            label: game.name,
            href: `https://store.steampowered.com/app/${game.appId}`,
            isExternal: true,
          }))}
        />
      )}
    </div>
  );
};
