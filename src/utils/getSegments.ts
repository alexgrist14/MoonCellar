import { IGame } from "../interfaces/game";
import { store } from "../store";
import { shuffle } from "./shuffle";

export const getSegments = (games: IGame[], max: number) => {
  const { isOnlyWithAchievements, apiType } = store.getState().selected;
  const filteredGames = games.filter(
    (game) =>
      apiType === "IGDB" || !isOnlyWithAchievements || !!game.achievements
  );

  const sortedGames = shuffle(filteredGames);

  const startIndex =
    sortedGames.length - max >= 0
      ? Math.random() * (sortedGames.length - max)
      : 0;

  const randomGames = sortedGames.slice(startIndex, startIndex + max);

  return !!randomGames?.length
    ? randomGames.map(
        (game) => game.id + "_" + games.findIndex((el) => el.id === game.id)
      )
    : [];
};
