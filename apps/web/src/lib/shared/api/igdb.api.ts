import { API_URL } from "../constants";
import { IGameResponse } from "../lib/schemas/games.schema";
import agent from "./agent.api";

const IGDB_URL = `${API_URL}/igdb`;

const parseGame = (igdbId: number, parseImages = true) => {
  return agent.post<IGameResponse>(`${IGDB_URL}/games/parse`, undefined, {
    params: { igdbId, parseImages },
  });
};

export const igdbApi = {
  parseGame,
};
