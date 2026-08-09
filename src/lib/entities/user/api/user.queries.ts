import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { gamesApi, userAPI } from "@/src/lib/shared/api";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { ILogs } from "@/src/lib/shared/types/user.type";
import { userQueryKeys } from "./user.query-keys";

export interface IUserLogWithGame extends ILogs {
  game?: IGameResponse;
}

export const useUserLogsQuery = (userId: string, page: number, take: number) =>
  useQuery({
    queryKey: userQueryKeys.logs(userId, page, take),
    queryFn: async () => {
      const { data } = await userAPI.getUserLogs(userId, { page, take });

      const _ids = data.results.map((log) => log.gameId);
      const games = _ids.length
        ? await gamesApi.getByIds({ _ids }).then((res) => res.data)
        : [];

      const results: IUserLogWithGame[] = data.results.map((log) => ({
        ...log,
        game: games.find((game) => game._id === log.gameId),
      }));

      return { total: data.total, results };
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useUserFiltersQuery = (userId: string) =>
  useQuery({
    queryKey: userQueryKeys.filters(userId),
    queryFn: () =>
      userAPI.getFilters(userId).then(({ data }) => data.filters ?? []),
    enabled: !!userId,
    staleTime: 60000,
  });

export const useUserPresetsQuery = (userId: string) =>
  useQuery({
    queryKey: userQueryKeys.presets(userId),
    queryFn: () =>
      userAPI.getPresets(userId).then(({ data }) => data.presets ?? []),
    enabled: !!userId,
    staleTime: 60000,
  });
