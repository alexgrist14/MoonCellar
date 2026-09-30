import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { IGetAdminCharacters } from "@mooncellar/schemas";
import { charactersApi } from "@/src/lib/shared/api";
import { characterQueryKeys } from "./character.query-keys";

export const useCharacterSearchQuery = (search: string, take = 8) =>
  useQuery({
    queryKey: characterQueryKeys.search(search),
    queryFn: () =>
      charactersApi.search({ search, take }).then(({ data }) => data),
    enabled: search.length >= 2,
    staleTime: 60000,
  });

export const useAdminCharactersQuery = (params: IGetAdminCharacters) =>
  useQuery({
    queryKey: characterQueryKeys.admin(params),
    queryFn: () => charactersApi.getAdminList(params).then(({ data }) => data),
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });

const AI_DRAFTS_REFRESH_MS = 3000;

export const useCharacterAiDraftsQuery = () =>
  useQuery({
    queryKey: characterQueryKeys.aiDrafts(),
    queryFn: () => charactersApi.getAiDrafts().then(({ data }) => data),
    refetchInterval: ({ state }) =>
      state.data?.some((run) => run.status === "running")
        ? AI_DRAFTS_REFRESH_MS
        : false,
  });

export const useCharacterByIdQuery = (id?: string) =>
  useQuery({
    queryKey: [...characterQueryKeys.all, "by-id", id],
    queryFn: () =>
      charactersApi
        .search({ ids: id!, take: 1 })
        .then(({ data }) => data.find((item) => item._id === id) ?? null),
    enabled: !!id,
  });
