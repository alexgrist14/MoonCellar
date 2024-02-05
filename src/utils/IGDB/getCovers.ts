import { IGDBAgent } from "../../api";
import { IIGDBCover } from "../../interfaces";

export const getCovers = (games: number[]) => {
  return IGDBAgent<IIGDBCover[]>("https://api.igdb.com/v4/covers", {
    limit: 500,
    fields: "url",
    where: `game = (${games.join(", ")})`,
  });
};
