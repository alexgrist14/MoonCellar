import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  IGameResponse,
  IGetGamesRequest,
} from "../../../shared/lib/schemas/games.schema";
import { IGamesListResponse } from "@/src/lib/shared/types/games.type";
import { IGameStats } from "@/src/lib/shared/lib/schemas/game-stats.schema";
import { gameQueryKeys } from "./game.query-keys";
import { adminGamesApi, gamesApi } from "@/src/lib/shared/api";

export const useGamesQuery = (
  params: IGetGamesRequest,
  enabled = true,
  initialData?: IGamesListResponse
) =>
  useQuery({
    queryKey: gameQueryKeys.list(params),
    queryFn: () => gamesApi.getAll(params).then(({ data }) => data),
    enabled,
    staleTime: 60000,
    initialData,
  });

export const useGamesByIdsQuery = (
  ids: string[],
  search?: string,
  enabled = true
) => {
  const queryClient = useQueryClient();

  const cached = useMemo(() => {
    if (!!search || !ids.length) return undefined;

    const entries = queryClient.getQueriesData<IGameResponse[]>({
      queryKey: [...gameQueryKeys.all, "by-ids"],
    });

    for (const [, games] of entries) {
      if (!games?.length) continue;

      const byId = new Map(games.map((game) => [game._id, game]));

      if (ids.every((id) => byId.has(id))) {
        return ids.map((id) => byId.get(id)!);
      }
    }

    return undefined;
  }, [ids, search, queryClient]);

  return useQuery({
    queryKey: gameQueryKeys.byIds(ids, search),
    queryFn: async () => {
      const { data } = await gamesApi.getByIds({ _ids: ids, search });

      return ids.flatMap((id) => {
        const game = data.find((item) => item._id === id);
        return game ? [game] : [];
      });
    },
    enabled: enabled && ids.length > 0,
    staleTime: 60000,
    initialData: cached,
    initialDataUpdatedAt: () => (cached ? Date.now() : undefined),
  });
};

export const useGameFollowingsStatusQuery = (
  gameId: string,
  profileId: string
) =>
  useQuery({
    queryKey: gameQueryKeys.followingsStatus(gameId, profileId),
    queryFn: () =>
      gamesApi.getFollowingsStatus(gameId, profileId).then(({ data }) => data),
    enabled: !!gameId && !!profileId,
    staleTime: 60000,
  });

export const useGameStatsQuery = (gameId: string, initialData?: IGameStats) =>
  useQuery({
    queryKey: gameQueryKeys.stats(gameId),
    queryFn: () => gamesApi.getStats(gameId).then(({ data }) => data),
    enabled: !!gameId,
    staleTime: 60000,
    initialData,
  });

export const useAdminGameQuery = (gameId?: string) =>
  useQuery({
    queryKey: gameQueryKeys.adminDetail(gameId ?? ""),
    queryFn: () => adminGamesApi.getGameById(gameId!).then(({ data }) => data),
    enabled: Boolean(gameId),
    staleTime: Infinity,
  });

type GameFilters = NonNullable<Awaited<ReturnType<typeof gamesApi.getFilters>>>;

export const useGameFiltersQuery = () =>
  useQuery({
    queryKey: gameQueryKeys.filters(),
    queryFn: async (): Promise<Partial<GameFilters>> => {
      try {
        return (await gamesApi.getFilters()) ?? {};
      } catch {
        return {};
      }
    },
    staleTime: Infinity,
  });
