import { gamesApi } from "@/src/lib/shared/api";
import {
  IAddGameRequest,
  IGameResponse,
  IUpdateGameRequest,
} from "@/src/lib/shared/lib/schemas/games.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gameQueryKeys } from "./game.query-keys";

interface IGamesListData {
  results: IGameResponse[];
  total: number;
}

interface IUpdateGameVariables {
  gameId: string;
  patch: IUpdateGameRequest;
}

interface IUploadGameImageVariables {
  gameId: string;
  type: "cover" | "screenshot" | "artwork";
  file: File;
}

export const useUpdateGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, patch }: IUpdateGameVariables) => {
      return gamesApi.update(gameId, patch).then(({ data }) => data);
    },
    onMutate: async ({ gameId, patch }) => {
      await queryClient.cancelQueries({ queryKey: gameQueryKeys.lists() });
      const previousLists = queryClient.getQueriesData<IGamesListData>({
        queryKey: gameQueryKeys.lists(),
      });

      queryClient.setQueriesData<IGamesListData>(
        { queryKey: gameQueryKeys.lists() },
        (data) =>
          data
            ? {
                ...data,
                results: data.results.map((game) =>
                  game._id === gameId ? { ...game, ...patch } : game
                ),
              }
            : data
      );

      return { previousLists };
    },
    onSuccess: (data, { gameId }) => {
      queryClient.setQueryData(gameQueryKeys.adminDetail(gameId), data);
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.lists() });
    },
  });
};

export const useDeleteGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => {
      return gamesApi.remove(gameId).then(({ data }) => data);
    },
    onMutate: async (gameId) => {
      await queryClient.cancelQueries({ queryKey: gameQueryKeys.lists() });
      const previousLists = queryClient.getQueriesData<IGamesListData>({
        queryKey: gameQueryKeys.lists(),
      });

      queryClient.setQueriesData<IGamesListData>(
        { queryKey: gameQueryKeys.lists() },
        (data) => {
          if (!data) return data;
          const containsGame = data.results.some((game) => game._id === gameId);
          if (!containsGame) return data;
          return {
            ...data,
            results: data.results.filter((game) => game._id !== gameId),
            total: Math.max(0, data.total - 1),
          };
        }
      );

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.lists() });
    },
  });
};

export const useCreateGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IAddGameRequest) =>
      gamesApi.add(data).then(({ data }) => data),

    onSuccess: (data) => {
      queryClient.setQueryData(gameQueryKeys.adminDetail(data._id), data);
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.lists(),
      });
    },
  });
};

export const useUploadGameImageMutation = () =>
  useMutation({
    mutationFn: ({ gameId, type, file }: IUploadGameImageVariables) =>
      gamesApi.uploadImage(gameId, type, file).then(({ data }) => data),
  });
