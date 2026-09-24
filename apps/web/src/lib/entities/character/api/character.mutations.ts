import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ISaveCharacterRequest } from "@mooncellar/schemas";
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
