import { FC, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ISteamSyncResponse } from "@mooncellar/schemas";
import { useUserListsQuery } from "@/src/lib/entities/list/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SvgSteam } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { getListHref } from "@/src/lib/shared/utils/links.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  useSteamLinkMutation,
  useSteamLoginMutation,
  useSteamSyncMutation,
  useSteamUnlinkMutation,
} from "../../model/useSteamAccount";
import styles from "./SteamAccount.module.scss";

const UNLINK_STEAM_MODAL_ID = "unlink-steam";

const getErrorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error) ? error.response?.data?.message : undefined) ?? fallback;

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
  const { data: lists } = useUserListsQuery(profile?._id, undefined, !!steam);
  const steamList = lists?.find((list) => list.source === "steam");

  const login = useSteamLoginMutation();
  const link = useSteamLinkMutation();
  const sync = useSteamSyncMutation();
  const unlink = useSteamUnlinkMutation();
  const isBusy =
    login.isPending || link.isPending || sync.isPending || unlink.isPending;

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
      onError: (error) =>
        toast.error({
          description: getErrorMessage(error, "Steam account was not linked"),
        }),
    });
  }, [linkAccount]);

  const handleLogin = () =>
    login.mutate(undefined, {
      onError: (error) =>
        toast.error({
          description: getErrorMessage(error, "Steam sign-in is unavailable"),
        }),
    });

  const handleSync = () =>
    sync.mutate(undefined, {
      onSuccess: ({ matchedCount, ownedCount, unmatched }) => {
        setUnmatched(unmatched);
        toast.success({
          title: "Steam library updated",
          description: `${matchedCount} of ${ownedCount} games imported`,
        });
      },
      onError: (error) =>
        toast.error({
          description: getErrorMessage(error, "Steam library was not updated"),
        }),
    });

  const handleUnlink = () =>
    modal.open(
      <ConfirmModal
        title="Unlink Steam"
        message={`Unlink your Steam account? ${
          steamList ? `The “${steamList.name}” list is deleted with it.` : ""
        }`}
        warning="Likes on the list and links to it are lost."
        onCancel={() => modal.close(UNLINK_STEAM_MODAL_ID)}
        onConfirm={async () => {
          try {
            await unlink.mutateAsync();
            toast.success({ description: "Steam account unlinked" });
          } catch (error) {
            toast.error({
              description: getErrorMessage(error, "Steam was not unlinked"),
            });
          }

          modal.close(UNLINK_STEAM_MODAL_ID);
        }}
      />,
      { id: UNLINK_STEAM_MODAL_ID }
    );

  if (!steam) {
    return (
      <div className={styles.steam}>
        <span className={styles.steam__note}>
          Sign in through Steam to import your library as a list. The list stays
          in sync with Steam and is deleted when you unlink the account. Your
          Steam profile must show game details publicly.
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
        {steamList && (
          <>
            {" "}
            Your library is the{" "}
            <Link href={getListHref(steamList)}>{steamList.name}</Link> list.
          </>
        )}
      </span>
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
