import {
  IAddConflictCandidateRequest,
  IConflictItemResponse,
  IConflictSource,
  IConflictsResponse,
  IConflictsSummary,
  IDecideConflictRequest,
  IGameConflict,
  IGetConflictsParams,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const CONFLICTS_URL = `${API_URL}/conflicts`;

const getSummary = (source?: IConflictSource) => {
  return agent.get<IConflictsSummary>(CONFLICTS_URL, { params: { source } });
};

const getList = (params: IGetConflictsParams) => {
  return agent.get<IConflictsResponse>(`${CONFLICTS_URL}/list`, { params });
};

const getItem = (source: IConflictSource, externalId: string) => {
  return agent.get<IConflictItemResponse>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}`
  );
};

const decide = (
  source: IConflictSource,
  externalId: string,
  choice: IDecideConflictRequest
) => {
  return agent.post<IConflictsSummary>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}/decision`,
    choice
  );
};

const addCandidate = (
  source: IConflictSource,
  externalId: string,
  dto: IAddConflictCandidateRequest
) => {
  return agent.post<void>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}/candidates`,
    dto
  );
};

const reopen = (source: IConflictSource, externalId: string) => {
  return agent.post<IConflictsSummary>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}/reopen`
  );
};

const getByGame = (gameId: string) =>
  agent.get<IGameConflict[]>(`${CONFLICTS_URL}/by-game/${gameId}`);

export const adminConflictsApi = {
  getSummary,
  getByGame,
  getList,
  getItem,
  decide,
  addCandidate,
  reopen,
};
