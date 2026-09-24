import {
  IContentRequest,
  IContentRequestDetail,
  ICreateContentRequest,
  IDecideContentRequest,
  IDecideContentRequestResponse,
  IGetContentRequests,
  IGetContentRequestsResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const REQUESTS_URL = `${API_URL}/requests`;

export const contentRequestsApi = {
  create: (body: ICreateContentRequest) =>
    agent.post<IContentRequest>(REQUESTS_URL, body),
  getMine: () => agent.get<IContentRequest[]>(`${REQUESTS_URL}/mine`),
  withdraw: (id: string) => agent.delete(`${REQUESTS_URL}/${id}`),
  getList: (params: IGetContentRequests) =>
    agent.get<IGetContentRequestsResponse>(REQUESTS_URL, { params }),
  getOne: (id: string) =>
    agent.get<IContentRequestDetail>(`${REQUESTS_URL}/${id}`),
  decide: (id: string, body: IDecideContentRequest) =>
    agent.post<IDecideContentRequestResponse>(
      `${REQUESTS_URL}/${id}/decision`,
      body
    ),
};
