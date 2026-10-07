import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GAUNTLET_HISTORY_LIMIT } from "@mooncellar/schemas";
import { gauntletHistoryApi } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { gauntletHistoryQueryKeys } from "../api/gauntlet-history.queries";

export const useGauntletHistorySync = () => {
  const userId = useAuthStore((state) =>
    state.isAuth ? state.profile?._id : undefined
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    const guestGames = useGamesStore.getState().historyGames;

    if (!userId || !guestGames?.length) return;

    gauntletHistoryApi
      .add({
        gameIds: guestGames
          .slice(0, GAUNTLET_HISTORY_LIMIT)
          .map((game) => game._id),
      })
      .then(() => {
        useGamesStore.getState().setHistoryGames([]);
        queryClient.invalidateQueries({
          queryKey: gauntletHistoryQueryKeys.all,
        });
      })
      .catch(() => undefined);
  }, [userId, queryClient]);
};
