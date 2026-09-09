import { playthroughsAPI } from "@/src/lib/shared/api";
import { playthroughQueryKeys } from "./playthrough.query-keys";
import { useQuery } from "@tanstack/react-query";

export const usePlaythroughsQuery = (userId: string, gameId: string) =>
  useQuery({
    queryKey: playthroughQueryKeys.list(userId, gameId),
    queryFn: () =>
      playthroughsAPI.getAll({ userId, gameId }).then(({ data }) => data),
    enabled: !!userId && !!gameId,
    staleTime: 60000,
  });

export const usePlaythroughsMinimalQuery = (userId: string) =>
  useQuery({
    queryKey: playthroughQueryKeys.minimal(userId),
    queryFn: () =>
      playthroughsAPI.getAllMinimal({ userId }).then(({ data }) => data),
    enabled: !!userId,
    staleTime: 60000,
  });
