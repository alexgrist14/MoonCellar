import { useMutation } from "@tanstack/react-query";
import {
  IGenerateImageRequest,
  ISaveGeneratedImageRequest,
  ISuggestImageElementsRequest,
} from "@mooncellar/schemas";
import { generatedImagesApi } from "@/src/lib/shared/api";

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

export const useSaveGeneratedImageMutation = () =>
  useMutation({
    mutationFn: (data: ISaveGeneratedImageRequest) =>
      generatedImagesApi.save(data).then(({ data }) => data),
  });

export const useDeleteGeneratedImageMutation = () =>
  useMutation({
    mutationFn: (id: string) =>
      generatedImagesApi.remove(id).then(({ data }) => data),
  });
