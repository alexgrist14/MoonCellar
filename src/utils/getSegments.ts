import { IGame } from "../interfaces/responses";

export const getSegments = (games: IGame[], max: number) => {
  if (!!games && games.length > 0) {
    const randomIndices: number[] = [];
    while (randomIndices.length < max) {
      const randomIndex = Math.floor(Math.random() * games.length);
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex);
      }
    }
    return randomIndices.map((index) => games[index].title);
  } else {
    return [];
  }
};
