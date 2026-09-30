import {
  ISaveSiteSessionRequest,
  ISiteSession,
  ITestSiteSessionResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const SITES_URL = `${API_URL}/admin/sites`;

export const siteSessionsApi = {
  getAll: () => agent.get<ISiteSession[]>(SITES_URL),
  create: (dto: ISaveSiteSessionRequest) =>
    agent.post<ISiteSession>(SITES_URL, dto),
  update: (id: string, dto: ISaveSiteSessionRequest) =>
    agent.patch<ISiteSession>(`${SITES_URL}/${id}`, dto),
  remove: (id: string) => agent.delete(`${SITES_URL}/${id}`),
  test: (id: string) =>
    agent.post<ITestSiteSessionResponse>(`${SITES_URL}/${id}/test`),
};
