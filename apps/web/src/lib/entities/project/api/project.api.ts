import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ICreateProjectRequest,
  IProjectBlock,
  IUpdateProjectRequest,
} from "@mooncellar/schemas";
import { projectsApi } from "@/src/lib/shared/api";

export const projectQueryKeys = {
  all: ["projects"] as const,
  block: (slug: string, block: IProjectBlock) =>
    ["projects", slug, "data", block] as const,
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

export const useRotateProjectTokenMutation = () =>
  useMutation({
    mutationFn: (slug: string) =>
      projectsApi.rotateToken(slug).then(({ data }) => data),
  });
