import { useQuery } from "@tanstack/react-query";
import { IGetGamesRequest } from "../../../shared/lib/schemas/games.schema";
import { gameQueryKeys } from "./game.query-keys";
import { gamesApi } from "@/src/lib/shared/api";

export const useGamesQuery = (params: IGetGamesRequest, enabled = true) =>
  useQuery({
    queryKey: gameQueryKeys.list(params),
    queryFn: () => gamesApi.getAll(params).then(({ data }) => data),
    enabled,
    staleTime: 60000,
  });

export const useGamesByIdsQuery = (ids: string[]) =>
  useQuery({
    queryKey: gameQueryKeys.byIds(ids),
    queryFn: async () => {
      const { data } = await gamesApi.getByIds({ _ids: ids });

      return ids.flatMap((id) => {
        const game = data.find((item) => item._id === id);
        return game ? [game] : [];
      });
    },
    enabled: ids.length > 0,
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
