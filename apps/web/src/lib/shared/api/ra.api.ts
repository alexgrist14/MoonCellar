import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const RA_URL = `${API_URL}/ra`;

export interface IRaParseResponse {
  status: "updated";
  message: string;
  slug: string;
}

const parseGame = (target: { gameId: string; raId?: string }) =>
  agent.post<IRaParseResponse>(`${RA_URL}/games/parse`, undefined, {
    params: target,
  });

export const raApi = {
  parseGame,
};
