import {
  ICustomListGamesFilters,
  ICustomListSort,
  IGetCustomListsRequest,
} from "@mooncellar/schemas";

export const listQueryKeys = {
  all: ["lists"] as const,
  catalogue: (params: IGetCustomListsRequest) =>
    [...listQueryKeys.all, "catalogue", params] as const,
  user: (userId: string) => [...listQueryKeys.all, "user", userId] as const,
  userWithGame: (userId: string, gameId?: string) =>
    [...listQueryKeys.user(userId), gameId ?? "all"] as const,
  likedBy: (userId: string) => [...listQueryKeys.all, "liked", userId] as const,
  gameCounts: (userId: string) =>
    [...listQueryKeys.all, "game-counts", userId] as const,
  bySlug: (
    userName: string,
    slug: string,
    sort: ICustomListSort = {},
    filters?: ICustomListGamesFilters
  ) =>
    [
      ...listQueryKeys.all,
      "slug",
      userName,
      slug,
      sort,
      ...(filters ? [filters] : []),
    ] as const,
};
