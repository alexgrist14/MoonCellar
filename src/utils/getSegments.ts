import { IIGDBGame } from "../interfaces";
import { IGame } from "../interfaces/responses";

export const getSegments = (
  gamesRA: IGame[],
  gamesIGDB: IIGDBGame[],
  max: number
) => {
  if (!!gamesRA?.length || !!gamesIGDB?.length) {
    const randomIndices: number[] = [];
    while (randomIndices.length < max) {
      const randomIndex = Math.floor(
        Math.random() * (!!gamesRA?.length ? gamesRA : gamesIGDB).length
      );
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex);
      }
    }
    return randomIndices.map(
      (index) => (!!gamesRA?.length ? gamesRA : gamesIGDB)[index].id.toString()
    );
  } else {
    return [];
  }
};
