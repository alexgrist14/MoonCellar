import {
  IConflictItemResponse,
  IConflictSource,
  IConflictsResponse,
  IConflictsSummary,
  IDecideConflictRequest,
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

const reopen = (source: IConflictSource, externalId: string) => {
  return agent.post<IConflictsSummary>(
    `${CONFLICTS_URL}/${source}/${encodeURIComponent(externalId)}/reopen`
  );
};

export const adminConflictsApi = {
  getSummary,
  getList,
  getItem,
  decide,
  reopen,
};
