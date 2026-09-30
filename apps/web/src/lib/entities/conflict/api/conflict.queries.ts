import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { IConflictSource, IGetConflictsParams } from "@mooncellar/schemas";
import { adminConflictsApi } from "@/src/lib/shared/api";
import { conflictQueryKeys } from "./conflict.query-keys";

const SUMMARY_REFRESH_MS = 5000;

export const conflictItemQueryOptions = (
  source: IConflictSource,
  externalId: string
) =>
  queryOptions({
    queryKey: conflictQueryKeys.item(source, externalId),
    queryFn: () =>
      adminConflictsApi.getItem(source, externalId).then(({ data }) => data),
    staleTime: Infinity,
  });

export const useConflictItemQuery = (
  source: IConflictSource,
  externalId: string | null
) =>
  useQuery({
    ...conflictItemQueryOptions(source, externalId ?? ""),
    enabled: !!externalId,
  });

export const useConflictsSummaryQuery = (
  source?: IConflictSource,
  isEnabled = true
) =>
  useQuery({
    queryKey: conflictQueryKeys.summary(source),
    queryFn: () =>
      adminConflictsApi.getSummary(source).then(({ data }) => data),
    refetchInterval: ({ state }) =>
      state.data?.applying ? SUMMARY_REFRESH_MS : false,
    enabled: isEnabled,
  });

export const useConflictsQuery = (params: IGetConflictsParams) =>
  useQuery({
    queryKey: conflictQueryKeys.list(params),
    queryFn: () => adminConflictsApi.getList(params).then(({ data }) => data),
    placeholderData: keepPreviousData,
  });
