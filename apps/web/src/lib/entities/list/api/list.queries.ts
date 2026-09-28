import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ICustomListDetails,
  ICustomListSort,
  IGetCustomListsRequest,
  IGetCustomListsResponse,
} from "@mooncellar/schemas";
import { listsAPI } from "@/src/lib/shared/api";
import { listQueryKeys } from "./list.query-keys";

export const useListsQuery = (
  params: IGetCustomListsRequest,
  options?: { enabled?: boolean; initialData?: IGetCustomListsResponse }
) =>
  useQuery({
    queryKey: listQueryKeys.catalogue(params),
    queryFn: () => listsAPI.getLists(params).then(({ data }) => data),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useUserListsQuery = (
  userId?: string,
  gameId?: string,
  enabled = true
) =>
  useQuery({
    queryKey: listQueryKeys.userWithGame(userId ?? "", gameId),
    queryFn: () =>
      listsAPI.getUserLists(userId as string, gameId).then(({ data }) => data),
    enabled: !!userId && enabled,
    staleTime: 60000,
  });

export const useLikedListsQuery = (userId?: string) =>
  useQuery({
    queryKey: listQueryKeys.likedBy(userId ?? ""),
    queryFn: () =>
      listsAPI.getLikedLists(userId as string).then(({ data }) => data),
    enabled: !!userId,
    staleTime: 60000,
  });

export const useMyListGameCountsQuery = (userId?: string) =>
  useQuery({
    queryKey: listQueryKeys.gameCounts(userId ?? ""),
    queryFn: () => listsAPI.getMyGameCounts().then(({ data }) => data),
    enabled: !!userId,
    staleTime: 5 * 60000,
  });

export const useListBySlugQuery = (
  userName: string,
  slug: string,
  sort: ICustomListSort,
  initialData?: ICustomListDetails
) =>
  useQuery({
    queryKey: listQueryKeys.bySlug(userName, slug, sort),
    queryFn: () =>
      listsAPI.getBySlug(userName, slug, sort).then(({ data }) => data),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });
