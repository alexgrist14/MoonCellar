import { useQuery } from "@tanstack/react-query";
import { IGetGamesRequest } from "../../../shared/lib/schemas/games.schema";
import { IGamesListResponse } from "@/src/lib/shared/types/games.type";
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
) =>
  useQuery({
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
  });

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
