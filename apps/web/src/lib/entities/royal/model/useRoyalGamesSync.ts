import { useEffect } from "react";
import {
  IRoyalGamesChangedEvent,
  ROYAL_GAMES_LIMIT,
  RoyalSocketEvent,
} from "@mooncellar/schemas";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import {
  getRoyalSocket,
  IRoyalSocket,
} from "@/src/lib/shared/socket/royal.socket";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useRoyalStore } from "@/src/lib/shared/store/royal.store";
import {
  addAccountRoyalGames,
  syncRoyalGames,
} from "../api/royal.requests";

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

const moveGuestRoyalGames = (guestRoyalGames: string[]) =>
  addAccountRoyalGames(guestRoyalGames.slice(0, ROYAL_GAMES_LIMIT), "end").then(
    (response) => {
      if (response) useGamesStore.getState().setRoyalGames([]);
    }
  );

export const useRoyalGamesSync = () => {
  const userId = useAuthStore((state) =>
    state.isAuth ? state.profile?._id : undefined
  );

  useEffect(() => {
    if (!userId) return;

    let socket: IRoyalSocket | undefined;
    let isCancelled = false;
    let isRefreshTried = false;

    const onConnect = () => {
      isRefreshTried = false;

      const guestRoyalGames = useGamesStore.getState().royalGames;

      if (guestRoyalGames?.length) {
        moveGuestRoyalGames(guestRoyalGames);
        return;
      }

      syncRoyalGames();
    };

    const onChanged = ({ royalGames }: IRoyalGamesChangedEvent) =>
      useRoyalStore.getState().setAccountRoyalGames(royalGames);

    const onConnectError = (error: Error) => {
      if (error.message !== UNAUTHORIZED_SOCKET_ERROR || isRefreshTried) return;

      isRefreshTried = true;

      refreshAuth().then(() => {
        if (!isCancelled && useAuthStore.getState().isAuth) socket?.connect();
      });
    };

    getRoyalSocket()
      .then((royalSocket) => {
        if (isCancelled) return;

        socket = royalSocket;
        royalSocket.on("connect", onConnect);
        royalSocket.on(RoyalSocketEvent.CHANGED, onChanged);
        royalSocket.on("connect_error", onConnectError);
        royalSocket.connect();
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      socket?.off("connect", onConnect);
      socket?.off(RoyalSocketEvent.CHANGED, onChanged);
      socket?.off("connect_error", onConnectError);
      socket?.disconnect();
      useRoyalStore.getState().setAccountRoyalGames(undefined);
    };
  }, [userId]);
};
