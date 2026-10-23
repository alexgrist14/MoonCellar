import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  IArticleArchive,
  IGetAdminArticlesRequest,
  IGetArticlesRequest,
  IGetArticlesResponse,
} from "@mooncellar/schemas";
import { articlesAPI } from "@/src/lib/shared/api";
import { articleQueryKeys } from "./article.query-keys";

export const useArticlesQuery = (
  params: IGetArticlesRequest,
  initialData?: IGetArticlesResponse
) =>
  useQuery({
    queryKey: articleQueryKeys.feed(params),
    queryFn: () => articlesAPI.getArticles(params).then(({ data }) => data),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useArticleArchiveQuery = (initialData?: IArticleArchive) =>
  useQuery({
    queryKey: articleQueryKeys.archive(),
    queryFn: () => articlesAPI.getArchive().then(({ data }) => data),
    initialData,
    staleTime: 5 * 60000,
  });

export const useAdminArticlesQuery = (
  params: IGetAdminArticlesRequest,
  enabled = true
) =>
  useQuery({
    queryKey: articleQueryKeys.admin(params),
    queryFn: () =>
      articlesAPI.getAdminArticles(params).then(({ data }) => data),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAdminArticleQuery = (id?: string) =>
  useQuery({
    queryKey: articleQueryKeys.adminDetail(id ?? ""),
    queryFn: () => articlesAPI.getAdminArticle(id!).then(({ data }) => data),
    enabled: !!id,
  });
