import { IGame } from "../types/game";
import { shuffle } from "./shuffle";

export const getSegments = (games: IGame[], max: number) => {
  const sortedGames = shuffle(games);

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
