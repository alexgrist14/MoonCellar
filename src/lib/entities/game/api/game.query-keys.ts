import { IGetGamesRequest } from "../../../shared/lib/schemas/games.schema";

export const gameQueryKeys = {
  all: ["games"] as const,
  list: (params: IGetGamesRequest) =>
    [...gameQueryKeys.all, "list", params] as const,
  lists: () => [...gameQueryKeys.all, "list"] as const,
  detail: (slug: string) => [...gameQueryKeys.all, "detail", slug] as const,
  adminDetail: (gameId: string) =>
    [...gameQueryKeys.all, "admin", "detail", gameId] as const,
  byIds: (ids: string[]) => [...gameQueryKeys.all, "by-ids", ids.join('')] as const,
  followingsStatus: (gameId: string, profileId: string) =>
    [...gameQueryKeys.all, "followings-status", gameId, profileId] as const,
  filters: () => [...gameQueryKeys.all, "filters"] as const,
};
