import {
  IDecideVndbCandidateRequest,
  IGetVndbCandidatesParams,
  IVndbCandidatesResponse,
  IVndbCandidatesSummary,
  IVndbReviewItemResponse,
} from "@mooncellar/schemas";
import { API_URL } from "../constants";
import agent from "./agent.api";

const VNDB_CANDIDATES_URL = `${API_URL}/vndb/candidates`;

const getSummary = () => {
  return agent.get<IVndbCandidatesSummary>(VNDB_CANDIDATES_URL);
};

const getList = (params: IGetVndbCandidatesParams) => {
  return agent.get<IVndbCandidatesResponse>(`${VNDB_CANDIDATES_URL}/list`, {
    params,
  });
};

const getItem = (vnId: string) => {
  return agent.get<IVndbReviewItemResponse>(
    `${VNDB_CANDIDATES_URL}/${vnId}`
  );
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
  getList,
  getItem,
  decide,
};
