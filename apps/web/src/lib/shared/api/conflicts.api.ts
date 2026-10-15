import {
  IAddConflictCandidateRequest,
  IConflictAiMatch,
  IConflictItemResponse,
  IConflictsAiStatus,
  IConflictSource,
  IConflictsResponse,
  IConflictsSummary,
  IDecideConflictRequest,
  IGameConflict,
  IGetConflictsParams,
  IUndoAiMatchesRequest,
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

const undo = (source: IConflictSource, externalId: string) => {
  return agent.post<IConflictsSummary>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}/undo`
  );
};

const aiUrl = (source?: IConflictSource) =>
  `${CONFLICTS_URL}/${source ? `${source}/` : ""}ai`;

const reviewWithAi = (
  source: IConflictSource | undefined,
  params: { limit: number; apply: boolean }
) =>
  agent.post<{ message: string }>(aiUrl(source), undefined, {
    params,
  });

const createWithAi = (source?: IConflictSource) =>
  agent.post<{ message: string }>(`${aiUrl(source)}/create`);

const undoAiDecisions = (
  source?: IConflictSource,
  items?: IUndoAiMatchesRequest["items"]
) => agent.post<{ message: string }>(`${aiUrl(source)}/undo`, { items });

const getAiMatches = (source?: IConflictSource) =>
  agent.get<IConflictAiMatch[]>(`${CONFLICTS_URL}/ai/matches`, {
    params: { source },
  });

const getAiStatus = () =>
  agent.get<IConflictsAiStatus>(`${CONFLICTS_URL}/ai/status`);

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
  undo,
  reviewWithAi,
  createWithAi,
  undoAiDecisions,
  getAiStatus,
  getAiMatches,
};
