import { useQuery } from "@tanstack/react-query";
import { generatedImagesApi } from "@/src/lib/shared/api";
import { generatedImageQueryKeys } from "./generated-image.query-keys";

export const useGeneratedImagesQuery = () =>
  useQuery({
    queryKey: generatedImageQueryKeys.all,
    queryFn: () => generatedImagesApi.list().then(({ data }) => data),
  });
