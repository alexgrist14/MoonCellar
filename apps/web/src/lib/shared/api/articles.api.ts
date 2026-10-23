import {
  IArticle,
  IArticleArchive,
  IGetAdminArticlesRequest,
  IGetAdminArticlesResponse,
  IGetArticleSlugsResponse,
  IGetArticlesRequest,
  IGetArticlesResponse,
  ISaveArticleRequest,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const ARTICLES_URL = `${API_URL}/articles`;

export const articlesAPI = {
  getArticles: (params: IGetArticlesRequest) =>
    agent.get<IGetArticlesResponse>(ARTICLES_URL, { params }),
  getArchive: () => agent.get<IArticleArchive>(`${ARTICLES_URL}/archive`),
  getSlugs: () => agent.get<IGetArticleSlugsResponse>(`${ARTICLES_URL}/slugs`),
  getBySlug: (slug: string) =>
    agent.get<IArticle>(`${ARTICLES_URL}/by-slug`, { params: { slug } }),
  getAdminArticles: (params: IGetAdminArticlesRequest) =>
    agent.get<IGetAdminArticlesResponse>(`${ARTICLES_URL}/admin`, { params }),
  getAdminArticle: (id: string) =>
    agent.get<IArticle>(`${ARTICLES_URL}/admin/${id}`),
  create: (dto: ISaveArticleRequest) => agent.post<IArticle>(ARTICLES_URL, dto),
  update: (id: string, dto: ISaveArticleRequest) =>
    agent.patch<IArticle>(`${ARTICLES_URL}/${id}`, dto),
  remove: (id: string) => agent.delete(`${ARTICLES_URL}/${id}`),
};
