import { IVndbParseResponse } from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const VNDB_URL = `${API_URL}/vndb`;

const parseGame = (gameId: string) => {
  return agent.post<IVndbParseResponse>(`${VNDB_URL}/games/parse`, undefined, {
    params: { gameId },
  });
};

export const vndbApi = {
  parseGame,
};
