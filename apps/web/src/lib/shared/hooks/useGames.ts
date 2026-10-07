import { useCallback } from "react";
import { useAdvancedRouter } from "./useAdvancedRouter";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { parseQueryFilters } from "@/src/lib/shared/utils/filters.utils";
import { gamesApi } from "@/src/lib/shared/api";
import { shuffle } from "@/src/lib/shared/utils/common.utils";

export const useGames = (excludeGames?: string[]) => {
  const { asPath } = useAdvancedRouter();
  const { isRoyal } = useStatesStore();
  const setGames = useGamesStore((state) => state.setGames);

  const getIGDBGames = useCallback(async () => {
    if (isRoyal) return;

    const filters = parseQueryFilters(asPath);

    const res = await gamesApi.getAll({
      ...filters,
      isRandom: true,
      take: 16,
      ...(!!excludeGames?.length && { excludeGames }),
    });

    const games = shuffle(res.data.results);

    setGames(games);

    return games;
  }, [isRoyal, excludeGames, asPath, setGames]);

  return { getIGDBGames };
};
