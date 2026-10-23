import {
  ARTICLES_PAGE_SIZE,
  ArticleTypeSchema,
  IGetArticlesQuery,
} from "@mooncellar/schemas";
import { NEWS_HREF } from "@/src/lib/entities/article/model";

type IQuerySource = { get: (key: string) => string | null };

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const readInteger = (value: string | null, min: number, max: number) => {
  const number = Number(value);

  return Number.isInteger(number) && number >= min && number <= max
    ? number
    : undefined;
};

export const parseNewsQuery = (query: IQuerySource): IGetArticlesQuery => {
  const type = ArticleTypeSchema.safeParse(query.get("type"));
  const year = readInteger(query.get("year"), 2000, 3000);
  const month = year ? readInteger(query.get("month"), 1, 12) : undefined;
  const game = query.get("game");

  return {
    ...(type.success ? { type: type.data } : {}),
    ...(year ? { year } : {}),
    ...(month ? { month } : {}),
    ...(game && OBJECT_ID_PATTERN.test(game) ? { game } : {}),
    page: readInteger(query.get("page"), 1, 100000) ?? 1,
    take: ARTICLES_PAGE_SIZE,
  };
};

export const buildNewsQuery = (params: Partial<IGetArticlesQuery>) => {
  const query = new URLSearchParams();

  params.type && query.set("type", params.type);
  params.year && query.set("year", String(params.year));
  params.year && params.month && query.set("month", String(params.month));
  params.game && query.set("game", params.game);
  Number(params.page) > 1 && query.set("page", String(params.page));

  return query.toString();
};

export const getNewsHref = (params: Partial<IGetArticlesQuery>) => {
  const query = buildNewsQuery(params);

  return `${NEWS_HREF}${query ? `?${query}` : ""}`;
};

export const pushNewsQuery = (params: Partial<IGetArticlesQuery>) =>
  window.history.pushState(null, "", getNewsHref(params));

export const hasNewsFilters = (params: IGetArticlesQuery) =>
  !!params.type || !!params.year || !!params.game;
