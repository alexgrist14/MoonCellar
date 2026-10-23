import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ISaveArticleRequest } from "@mooncellar/schemas";
import { articlesAPI } from "@/src/lib/shared/api";
import { articleQueryKeys } from "./article.query-keys";

export const useSaveArticleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: ISaveArticleRequest }) =>
      (id ? articlesAPI.update(id, dto) : articlesAPI.create(dto)).then(
        ({ data }) => data
      ),
    onSuccess: (article) => {
      queryClient.setQueryData(
        articleQueryKeys.adminDetail(article._id),
        article
      );
      void queryClient.invalidateQueries({
        queryKey: articleQueryKeys.all,
        predicate: (query) =>
          query.queryKey[1] !== "admin-detail" ||
          query.queryKey[2] !== article._id,
      });
    },
  });
};

export const useDeleteArticleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesAPI.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({
        queryKey: articleQueryKeys.adminDetail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: articleQueryKeys.all,
        predicate: (query) => query.queryKey[1] !== "admin-detail",
      });
    },
  });
};
