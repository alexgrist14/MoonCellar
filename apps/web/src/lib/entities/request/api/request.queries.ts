import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { IGetContentRequests } from "@mooncellar/schemas";
import { contentRequestsApi } from "@/src/lib/shared/api";
import { requestQueryKeys } from "./request.query-keys";

export const useMyRequestsQuery = (enabled = true) =>
  useQuery({
    queryKey: requestQueryKeys.mine(),
    queryFn: () => contentRequestsApi.getMine().then(({ data }) => data),
    enabled,
    staleTime: 30000,
  });

export const useRequestsQuery = (params: IGetContentRequests, enabled = true) =>
  useQuery({
    queryKey: requestQueryKeys.list(params),
    queryFn: () => contentRequestsApi.getList(params).then(({ data }) => data),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });

export const useRequestQuery = (id?: string) =>
  useQuery({
    queryKey: requestQueryKeys.detail(id ?? ""),
    queryFn: () => contentRequestsApi.getOne(id!).then(({ data }) => data),
    enabled: !!id,
  });
