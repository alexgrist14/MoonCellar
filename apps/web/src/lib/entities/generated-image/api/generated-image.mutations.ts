import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IGenerateImageRequest,
  ISaveGeneratedImageRequest,
  ISuggestImageElementsRequest,
} from "@mooncellar/schemas";
import { generatedImagesApi } from "@/src/lib/shared/api";
import { generatedImageQueryKeys } from "./generated-image.query-keys";

export const useGenerateImageMutation = () =>
  useMutation({
    mutationFn: (data: IGenerateImageRequest) =>
      generatedImagesApi.generate(data).then(({ data }) => data),
  });

export const useSuggestImageElementsMutation = () =>
  useMutation({
    mutationFn: (data: ISuggestImageElementsRequest) =>
      generatedImagesApi.suggestElements(data).then(({ data }) => data),
  });

export const useSaveGeneratedImageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ISaveGeneratedImageRequest) =>
      generatedImagesApi.save(data).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatedImageQueryKeys.all });
    },
  });
};

export const useDeleteGeneratedImageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      generatedImagesApi.remove(id).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatedImageQueryKeys.all });
    },
  });
};
