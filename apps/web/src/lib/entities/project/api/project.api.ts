import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ICreatePlanSectionRequest,
  ICreatePlanTaskRequest,
  IPlanBlock,
  IPlanTaskAction,
  IPlanTaskActionRequest,
  IUpdatePlanSectionRequest,
  IUpdatePlanTaskRequest,
  ICreateProjectRequest,
  IProjectBlock,
  IUpdateProjectRequest,
} from "@mooncellar/schemas";
import { projectsApi } from "@/src/lib/shared/api";

export const projectQueryKeys = {
  all: ["projects"] as const,
  plan: (slug: string) => ["projects", slug, "plan"] as const,
  planEvents: (slug: string, task?: string) =>
    ["projects", slug, "plan", "events", task ?? ""] as const,
  block: (slug: string, block: IProjectBlock) =>
    ["projects", slug, "data", block] as const,
  decompFunctions: (slug: string) =>
    ["projects", slug, "data", "decomp", "functions"] as const,
};

const BLOCK_REFRESH_MS = 60_000;

export const useProjectsQuery = () =>
  useQuery({
    queryKey: projectQueryKeys.all,
    queryFn: () => projectsApi.getAll().then(({ data }) => data),
    refetchInterval: BLOCK_REFRESH_MS,
  });

export const useProjectBlockQuery = <T>(
  slug: string,
  block: IProjectBlock,
  isEnabled: boolean
) =>
  useQuery({
    queryKey: projectQueryKeys.block(slug, block),
    queryFn: () =>
      projectsApi.getBlock<T>(slug, block).then(({ data }) => data),
    enabled: isEnabled,
    refetchInterval: BLOCK_REFRESH_MS,
  });

/**
 * What every cell of the Decompilation map is (address, size, file, name). Large and rarely
 * changing, so it is loaded only when asked for (the map's first hover) and kept for the visit.
 */
export const useDecompFunctionsQuery = (slug: string, isEnabled: boolean) =>
  useQuery({
    queryKey: projectQueryKeys.decompFunctions(slug),
    queryFn: () =>
      projectsApi.getDecompFunctions(slug).then(({ data }) => data),
    enabled: isEnabled,
    staleTime: Infinity,
    retry: false,
  });

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateProjectRequest) =>
      projectsApi.create(dto).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, dto }: { slug: string; dto: IUpdateProjectRequest }) =>
      projectsApi.update(slug, dto).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => projectsApi.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};

export const useAddProjectTokenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, name }: { slug: string; name: string }) =>
      projectsApi.addToken(slug, name).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};

export const useRevokeProjectTokenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, id }: { slug: string; id: string }) =>
      projectsApi.revokeToken(slug, id).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};

export const useConnectProjectMutation = () =>
  useMutation({
    mutationFn: ({ slug, name }: { slug: string; name: string }) =>
      projectsApi.connect(slug, name).then(({ data }) => data),
  });

const PLAN_REFRESH_MS = 30_000;

export const useProjectPlanQuery = (slug: string, isEnabled: boolean) =>
  useQuery({
    queryKey: projectQueryKeys.plan(slug),
    queryFn: () => projectsApi.getPlan(slug).then(({ data }) => data),
    enabled: isEnabled,
    refetchInterval: PLAN_REFRESH_MS,
  });

export const usePlanEventsQuery = (slug: string, task?: string) =>
  useQuery({
    queryKey: projectQueryKeys.planEvents(slug, task),
    queryFn: () =>
      projectsApi.getPlanEvents(slug, task).then(({ data }) => data),
  });

const usePlanMutation = <T>(
  slug: string,
  request: (variables: T) => Promise<{ data: IPlanBlock }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: T) => request(variables).then(({ data }) => data),
    onSuccess: (plan) => {
      queryClient.setQueryData(projectQueryKeys.plan(slug), plan);
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.planEvents(slug),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
        exact: true,
      });
    },
  });
};

export const usePlanTaskActionMutation = (slug: string) =>
  usePlanMutation(
    slug,
    ({
      id,
      action,
      dto,
    }: {
      id: string;
      action: IPlanTaskAction;
      dto?: IPlanTaskActionRequest;
    }) => projectsApi.actOnPlanTask(slug, id, action, dto)
  );

export const useCreatePlanTaskMutation = (slug: string) =>
  usePlanMutation(slug, (dto: ICreatePlanTaskRequest) =>
    projectsApi.createPlanTask(slug, dto)
  );

export const useUpdatePlanTaskMutation = (slug: string) =>
  usePlanMutation(
    slug,
    ({ id, dto }: { id: string; dto: IUpdatePlanTaskRequest }) =>
      projectsApi.updatePlanTask(slug, id, dto)
  );

export const useDeletePlanTaskMutation = (slug: string) =>
  usePlanMutation(slug, (id: string) => projectsApi.deletePlanTask(slug, id));

export const useCreatePlanSectionMutation = (slug: string) =>
  usePlanMutation(slug, (dto: ICreatePlanSectionRequest) =>
    projectsApi.createPlanSection(slug, dto)
  );

export const useUpdatePlanSectionMutation = (slug: string) =>
  usePlanMutation(
    slug,
    ({ id, dto }: { id: string; dto: IUpdatePlanSectionRequest }) =>
      projectsApi.updatePlanSection(slug, id, dto)
  );

export const useDeletePlanSectionMutation = (slug: string) =>
  usePlanMutation(slug, (id: string) =>
    projectsApi.deletePlanSection(slug, id)
  );
