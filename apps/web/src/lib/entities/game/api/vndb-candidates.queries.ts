import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { IGetVndbCandidatesParams } from "@mooncellar/schemas";
import { adminVndbCandidatesApi } from "@/src/lib/shared/api";
import { vndbCandidateQueryKeys } from "./vndb-candidates.query-keys";

const SUMMARY_REFRESH_MS = 5000;

export const nextVndbCandidateQueryOptions = (after: string | null) =>
  queryOptions({
    queryKey: vndbCandidateQueryKeys.next(after),
    queryFn: () =>
      adminVndbCandidatesApi.getNext(after).then(({ data }) => data),
    staleTime: Infinity,
  });

export const useVndbCandidatesSummaryQuery = () =>
  useQuery({
    queryKey: vndbCandidateQueryKeys.summary(),
    queryFn: () =>
      adminVndbCandidatesApi.getSummary().then(({ data }) => data),
    refetchInterval: ({ state }) =>
      state.data?.applying ? SUMMARY_REFRESH_MS : false,
  });

export const useVndbCandidatesQuery = (params: IGetVndbCandidatesParams) =>
  useQuery({
    queryKey: vndbCandidateQueryKeys.list(params),
    queryFn: () =>
      adminVndbCandidatesApi.getList(params).then(({ data }) => data),
    placeholderData: keepPreviousData,
  });

export const useNextVndbCandidateQuery = (
  after: string | null,
  enabled: boolean
) => useQuery({ ...nextVndbCandidateQueryOptions(after), enabled });
