import { store } from "../../app/store";
import { IGame } from "../types/game";
import { shuffle } from "./shuffle";

export const getSegments = (games: IGame[], max: number) => {
  const { isOnlyWithAchievements, apiType } = store.getState().selected;
  const filteredGames = games.filter(
    (game) => apiType !== "RA" || !isOnlyWithAchievements || !!game.achievements
  );

  const sortedGames = shuffle(filteredGames);

  const startIndex =
    sortedGames.length - max >= 0
      ? Math.random() * (sortedGames.length - max)
      : 0;

  const randomGames = sortedGames.slice(startIndex, startIndex + max);

  return !!randomGames?.length
    ? randomGames.map(
        (game) =>
          (game._id || game.id) +
          "_" +
          games.findIndex((el) => (el._id || el.id) === (game._id || game.id))
      )
    : [];
};
