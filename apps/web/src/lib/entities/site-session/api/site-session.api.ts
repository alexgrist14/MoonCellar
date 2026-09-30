import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ISaveSiteSessionRequest } from "@mooncellar/schemas";
import { siteSessionsApi } from "@/src/lib/shared/api";

export const siteSessionQueryKeys = {
  all: ["site-sessions"] as const,
};

export const useSiteSessionsQuery = () =>
  useQuery({
    queryKey: siteSessionQueryKeys.all,
    queryFn: () => siteSessionsApi.getAll().then(({ data }) => data),
  });

export const useSaveSiteSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: ISaveSiteSessionRequest }) =>
      (id ? siteSessionsApi.update(id, dto) : siteSessionsApi.create(dto)).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSessionQueryKeys.all });
    },
  });
};

export const useDeleteSiteSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => siteSessionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSessionQueryKeys.all });
    },
  });
};

export const useTestSiteSessionMutation = () =>
  useMutation({
    mutationFn: (id: string) =>
      siteSessionsApi.test(id).then(({ data }) => data),
  });
