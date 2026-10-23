import {
  ICreatePlanSectionRequest,
  ICreatePlanTaskRequest,
  IPlanBlock,
  IPlanEvent,
  IPlanTaskAction,
  IPlanTaskActionRequest,
  IUpdatePlanSectionRequest,
  IUpdatePlanTaskRequest,
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
  getPlan: (slug: string) =>
    agent.get<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan`),
  getPlanEvents: (slug: string, task?: string) =>
    agent.get<IPlanEvent[]>(`${PROJECTS_URL}/${slug}/plan/events`, {
      params: task ? { task } : undefined,
    }),
  createPlanSection: (slug: string, dto: ICreatePlanSectionRequest) =>
    agent.post<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/sections`, dto),
  updatePlanSection: (
    slug: string,
    id: string,
    dto: IUpdatePlanSectionRequest
  ) =>
    agent.patch<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/sections/${id}`, dto),
  deletePlanSection: (slug: string, id: string) =>
    agent.delete<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/sections/${id}`),
  createPlanTask: (slug: string, dto: ICreatePlanTaskRequest) =>
    agent.post<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/tasks`, dto),
  updatePlanTask: (slug: string, id: string, dto: IUpdatePlanTaskRequest) =>
    agent.patch<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/tasks/${id}`, dto),
  deletePlanTask: (slug: string, id: string) =>
    agent.delete<IPlanBlock>(`${PROJECTS_URL}/${slug}/plan/tasks/${id}`),
  actOnPlanTask: (
    slug: string,
    id: string,
    action: IPlanTaskAction,
    dto: IPlanTaskActionRequest = {}
  ) =>
    agent.post<IPlanBlock>(
      `${PROJECTS_URL}/${slug}/plan/tasks/${id}/${action}`,
      dto
    ),
  connect: (slug: string, name: string) =>
    agent.post<IProjectConnectCode>(`${PROJECTS_URL}/${slug}/connect`, {
      name,
    }),
};
