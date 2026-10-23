import {
  ICreateProjectRequest,
  IProject,
  IProjectBlock,
  IProjectConnectCode,
  IProjectToken,
  IUpdateProjectRequest,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const PROJECTS_URL = `${API_URL}/projects`;

export const projectsApi = {
  getAll: () => agent.get<IProject[]>(PROJECTS_URL),
  getBySlug: (slug: string) => agent.get<IProject>(`${PROJECTS_URL}/${slug}`),
  getBlock: <T>(slug: string, block: IProjectBlock) =>
    agent.get<T>(`${PROJECTS_URL}/${slug}/data/${block}`),
  create: (dto: ICreateProjectRequest) =>
    agent.post<IProject>(PROJECTS_URL, dto),
  update: (slug: string, dto: IUpdateProjectRequest) =>
    agent.patch<IProject>(`${PROJECTS_URL}/${slug}`, dto),
  remove: (slug: string) => agent.delete(`${PROJECTS_URL}/${slug}`),
  addToken: (slug: string, name: string) =>
    agent.post<IProjectToken>(`${PROJECTS_URL}/${slug}/tokens`, { name }),
  revokeToken: (slug: string, id: string) =>
    agent.delete<IProject>(`${PROJECTS_URL}/${slug}/tokens/${id}`),
  connect: (slug: string, name: string) =>
    agent.post<IProjectConnectCode>(`${PROJECTS_URL}/${slug}/connect`, {
      name,
    }),
};
