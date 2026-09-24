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
    queryFn: () =>
      charactersApi.getAdminList(params).then(({ data }) => data),
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });
