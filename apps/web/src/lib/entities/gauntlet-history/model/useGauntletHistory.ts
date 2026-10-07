import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IGameResponse } from "@mooncellar/schemas";
import { gauntletHistoryApi } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import {
  gauntletHistoryQueryKeys,
  useGauntletHistoryIdsQuery,
} from "../api/gauntlet-history.queries";

const useAccountId = () =>
  useAuthStore((state) => (state.isAuth ? state.profile?._id : undefined));

export const useGauntletHistory = () => {
  const userId = useAccountId();
  const guestGames = useGamesStore((state) => state.historyGames);
  const queryClient = useQueryClient();

  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: gauntletHistoryQueryKeys.all,
      }),
    [queryClient]
  );

  const addGame = useCallback(
    (game: IGameResponse) =>
      userId
        ? gauntletHistoryApi
            .add({ gameIds: [game._id] })
            .then(refresh)
            .catch(() => undefined)
        : useGamesStore.getState().addHistoryGame(game),
    [userId, refresh]
  );

  const removeGame = useCallback(
    (game: IGameResponse) =>
      userId
        ? gauntletHistoryApi
            .remove(game._id)
            .then(refresh)
            .catch(() => undefined)
        : useGamesStore.getState().removeHistoryGame(game),
    [userId, refresh]
  );

  const clear = useCallback(
    () =>
      userId
        ? gauntletHistoryApi
            .clear()
            .then(refresh)
            .catch(() => undefined)
        : useGamesStore.getState().setHistoryGames([]),
    [userId, refresh]
  );

  return { userId, guestGames, addGame, removeGame, clear };
};

export const useGauntletHistoryIds = (enabled: boolean) => {
  const userId = useAccountId();
  const guestGames = useGamesStore((state) => state.historyGames);
  const { data: accountIds } = useGauntletHistoryIdsQuery(userId, enabled);

  return useMemo(() => {
    if (!enabled) return undefined;
    if (userId) return accountIds;

    return guestGames?.map((game) => game._id);
  }, [enabled, userId, accountIds, guestGames]);
};
