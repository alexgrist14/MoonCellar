import {
  IDecideVndbCandidateRequest,
  INextVndbCandidateResponse,
  IVndbCandidatesSummary,
} from "@mooncellar/schemas";
import { API_URL } from "../constants";
import agent from "./agent.api";

const VNDB_CANDIDATES_URL = `${API_URL}/vndb/candidates`;

const getSummary = () => {
  return agent.get<IVndbCandidatesSummary>(VNDB_CANDIDATES_URL);
};

const getNext = (after: string | null) => {
  return agent.get<INextVndbCandidateResponse>(`${VNDB_CANDIDATES_URL}/next`, {
    params: { after: after ?? undefined },
  });
};

const decide = (
  vnId: string,
  gameId: IDecideVndbCandidateRequest["gameId"]
) => {
  return agent.post<IVndbCandidatesSummary>(
    `${VNDB_CANDIDATES_URL}/${vnId}/decision`,
    { gameId }
  );
};

export const adminVndbCandidatesApi = {
  getSummary,
  getNext,
  decide,
};
