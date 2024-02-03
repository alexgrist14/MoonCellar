import { IGame } from "../interfaces/responses";

export const getSegments = (games: IGame[], max: number) => {
  if (!!games?.length) {
    const randomIndices: number[] = [];
    while (randomIndices.length < max) {
      const randomIndex = Math.floor(Math.random() * games.length);
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex);
      }
    }
    return randomIndices.map((index) => games[index].id + "_" + index);
  } else {
    return [];
  }
};
