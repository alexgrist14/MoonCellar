import { hashKey, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IAddCustomListGameRequest,
  ICreateCustomListRequest,
  IUpdateCustomListRequest,
} from "@mooncellar/schemas";
import { listsAPI } from "@/src/lib/shared/api";
import { userQueryKeys } from "@/src/lib/entities/user/api/user.query-keys";
import { listQueryKeys } from "./list.query-keys";

const useInvalidateLists = () => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: listQueryKeys.all }),
      queryClient.invalidateQueries({
        queryKey: [...userQueryKeys.all, "logs"],
      }),
    ]);
};

export const useCreateListMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: (dto: ICreateCustomListRequest) =>
      listsAPI.create(dto).then(({ data }) => data),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateListMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IUpdateCustomListRequest }) =>
      listsAPI.update(id, dto).then(({ data }) => data),
    onSuccess: () => invalidate(),
  });
};

export const useDeleteListMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; userName?: string; slug?: string }) =>
      listsAPI.remove(id).then(({ data }) => data),
    onSuccess: (_result, { userName, slug }) => {
      const deletedKey =
        userName && slug
          ? hashKey(listQueryKeys.bySlug(userName, slug))
          : undefined;

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: listQueryKeys.all,
          predicate: (query) =>
            !deletedKey || hashKey(query.queryKey) !== deletedKey,
        }),
        queryClient.invalidateQueries({
          queryKey: [...userQueryKeys.all, "logs"],
        }),
      ]);
    },
  });
};

export const useAddListGameMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IAddCustomListGameRequest }) =>
      listsAPI.addGame(id, dto).then(({ data }) => data),
    onSuccess: () => invalidate(),
  });
};

export const useAddListGamesMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: async ({ id, gameIds }: { id: string; gameIds: string[] }) => {
      for (const gameId of gameIds) {
        await listsAPI.addGame(id, { gameId, position: "end" });
      }

      return gameIds.length;
    },
    onSuccess: () => invalidate(),
  });
};

export const useRemoveListGameMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: ({ id, gameId }: { id: string; gameId: string }) =>
      listsAPI.removeGame(id, gameId).then(({ data }) => data),
    onSuccess: () => invalidate(),
  });
};

export const useReorderListMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: ({ id, gameIds }: { id: string; gameIds: string[] }) =>
      listsAPI.reorder(id, { gameIds }).then(({ data }) => data),
    onSuccess: () => invalidate(),
  });
};

export const useSetListLikeMutation = () => {
  const invalidate = useInvalidateLists();

  return useMutation({
    mutationFn: ({ id, isLiked }: { id: string; isLiked: boolean }) =>
      (isLiked ? listsAPI.like(id) : listsAPI.unlike(id)).then(
        ({ data }) => data
      ),
    onSuccess: () => invalidate(),
  });
};
