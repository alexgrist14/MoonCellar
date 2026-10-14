import { API_URL } from "@/src/lib/shared/constants";
import { IHltbField } from "@mooncellar/schemas";
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

const reviewConflicts = (params: { limit: number; apply: boolean }) =>
  agent.post<{ message: string }>(`${HLTB_URL}/conflicts/ai`, undefined, {
    params,
  });

const undoAiDecisions = () =>
  agent.post<{ message: string }>(`${HLTB_URL}/conflicts/ai/undo`);

export const hltbApi = {
  parseGame,
  reviewConflicts,
  undoAiDecisions,
};
