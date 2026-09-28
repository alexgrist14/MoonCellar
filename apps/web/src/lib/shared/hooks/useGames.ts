import { useCallback } from "react";
import { useAdvancedRouter } from "./useAdvancedRouter";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { parseQueryFilters } from "@/src/lib/shared/utils/filters.utils";
import { gamesApi } from "@/src/lib/shared/api";
import { useFiltersStore } from "@/src/lib/shared/store/filters.store";
import { shuffle } from "@/src/lib/shared/utils/common.utils";

export const useGames = () => {
  const { asPath } = useAdvancedRouter();
  const { isRoyal } = useStatesStore();
  const isExcludeHistory = useFiltersStore((state) => state.isExcludeHistory);
  const { setGames, historyGames } = useGamesStore();

  const getIGDBGames = useCallback(async () => {
    if (isRoyal) return;

    const filters = parseQueryFilters(asPath);

    const res = await gamesApi.getAll({
      ...filters,
      isRandom: true,
      take: 16,
      ...(isExcludeHistory &&
        !!historyGames?.length && {
          excludeGames: historyGames.map((game) => game._id),
        }),
    });

    const games = shuffle(res.data.results);

    setGames(games);

    return games;
  }, [isRoyal, isExcludeHistory, historyGames, asPath, setGames]);

  return { getIGDBGames };
};
