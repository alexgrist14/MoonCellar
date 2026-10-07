import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GAUNTLET_HISTORY_TAKE } from "@mooncellar/schemas";
import { gauntletHistoryApi } from "@/src/lib/shared/api";

export const gauntletHistoryQueryKeys = {
  all: ["gauntlet-history"] as const,
  page: (userId: string, page: number) =>
    [...gauntletHistoryQueryKeys.all, userId, "page", page] as const,
  ids: (userId: string) =>
    [...gauntletHistoryQueryKeys.all, userId, "ids"] as const,
};

export const useGauntletHistoryPageQuery = (
  userId: string | undefined,
  page: number
) =>
  useQuery({
    queryKey: gauntletHistoryQueryKeys.page(userId ?? "", page),
    queryFn: () =>
      gauntletHistoryApi
        .get({ page, take: GAUNTLET_HISTORY_TAKE })
        .then(({ data }) => data),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

export const useGauntletHistoryIdsQuery = (
  userId: string | undefined,
  enabled: boolean
) =>
  useQuery({
    queryKey: gauntletHistoryQueryKeys.ids(userId ?? ""),
    queryFn: () => gauntletHistoryApi.getIds().then(({ data }) => data),
    enabled: enabled && !!userId,
  });
