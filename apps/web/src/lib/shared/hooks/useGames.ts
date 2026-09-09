import { useCallback } from "react";
import { useAdvancedRouter } from "./useAdvancedRouter";
import { useGamesStore } from "../store/games.store";
import { useStatesStore } from "../store/states.store";
import { parseQueryFilters } from "../utils/filters.utils";
import { gamesApi } from "../api";
import { useFiltersStore } from "../store/filters.store";
import { shuffle } from "../utils/common.utils";

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
