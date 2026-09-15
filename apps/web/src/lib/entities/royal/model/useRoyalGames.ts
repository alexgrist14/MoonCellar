import { useCallback } from "react";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useRoyalStore } from "@/src/lib/shared/store/royal.store";
import {
  addAccountRoyalGames,
  removeAccountRoyalGames,
  replaceAccountRoyalGames,
} from "../api/royal.requests";

export const useRoyalGames = () => {
  const isAccount = useAuthStore(
    (state) => !!state.isAuth && !!state.profile?._id
  );
  const guestRoyalGames = useGamesStore((state) => state.royalGames);
  const accountRoyalGames = useRoyalStore((state) => state.accountRoyalGames);

  const addRoyalGame = useCallback(
    (gameId: string) =>
      isAccount
        ? addAccountRoyalGames([gameId], "start")
        : useGamesStore.getState().addRoyalGame(gameId),
    [isAccount]
  );

  const addRoyalGames = useCallback(
    (gameIds: string[]) =>
      isAccount
        ? addAccountRoyalGames(gameIds, "end")
        : useGamesStore.getState().addRoyalGames(gameIds),
    [isAccount]
  );

  const removeRoyalGame = useCallback(
    (gameId: string) =>
      isAccount
        ? removeAccountRoyalGames([gameId])
        : useGamesStore.getState().removeRoyalGame(gameId),
    [isAccount]
  );

  const setRoyalGames = useCallback(
    (gameIds: string[]) =>
      isAccount
        ? replaceAccountRoyalGames(gameIds)
        : useGamesStore.getState().setRoyalGames(gameIds),
    [isAccount]
  );

  return {
    royalGames: isAccount ? accountRoyalGames : guestRoyalGames,
    addRoyalGame,
    addRoyalGames,
    removeRoyalGame,
    setRoyalGames,
  };
};
