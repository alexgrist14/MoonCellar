import { API_URL } from "../constants";
import { IHltbField } from "../lib/schemas/games.schema";
import agent from "./agent.api";

const HLTB_URL = `${API_URL}/hltb`;

export interface IHltbParseResponse {
  status: "updated" | "not_found";
  message: string;
  gameId: string;
  slug: string;
  name: string;
  hltb: IHltbField | null;
}

const parseGame = (target: {
  gameId?: string;
  slug?: string;
  hltbId?: string;
}) => {
  return agent.post<IHltbParseResponse>(`${HLTB_URL}/games/parse`, undefined, {
    params: target,
  });
};

export const hltbApi = {
  parseGame,
};
