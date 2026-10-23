import {
  ICreateProjectRequest,
  IProject,
  IProjectBlock,
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
    agent.post<IProjectToken>(PROJECTS_URL, dto),
  update: (slug: string, dto: IUpdateProjectRequest) =>
    agent.patch<IProject>(`${PROJECTS_URL}/${slug}`, dto),
  remove: (slug: string) => agent.delete(`${PROJECTS_URL}/${slug}`),
  rotateToken: (slug: string) =>
    agent.post<IProjectToken>(`${PROJECTS_URL}/${slug}/token`),
};
