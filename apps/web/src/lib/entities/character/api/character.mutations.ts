import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ICharacterAiDraftRequest,
  ICharacterAiDraftRun,
  ISaveCharacterRequest,
} from "@mooncellar/schemas";
import { charactersApi } from "@/src/lib/shared/api";
import { characterQueryKeys } from "./character.query-keys";

export const useSaveCharacterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ISaveCharacterRequest }) =>
      (id ? charactersApi.update(id, body) : charactersApi.create(body)).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.all });
    },
  });
};

export const useDeleteCharacterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => charactersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.all });
    },
  });
};

export const useUploadCharacterImageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      charactersApi.uploadImage(id, file).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.all });
    },
  });
};

export const useStartCharacterAiDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICharacterAiDraftRequest) =>
      charactersApi.startAiDraft(dto).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.aiDrafts(),
      });
    },
  });
};

export const useRetryCharacterAiDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      charactersApi.retryAiDraft(id).then(({ data }) => data),
    onSuccess: (run) => {
      queryClient.setQueryData<ICharacterAiDraftRun[]>(
        characterQueryKeys.aiDrafts(),
        (runs) => runs?.map((item) => (item._id === run._id ? run : item))
      );
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.aiDrafts(),
      });
    },
  });
};

export const useDeleteCharacterAiDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => charactersApi.deleteAiDraft(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ICharacterAiDraftRun[]>(
        characterQueryKeys.aiDrafts(),
        (runs) => runs?.filter((run) => run._id !== id)
      );
    },
  });
};

export const useFindCharacterPortraitsMutation = () =>
  useMutation({
    mutationFn: (query: string) =>
      charactersApi.findPortraits({ query }).then(({ data }) => data.urls),
  });
