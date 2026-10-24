import { IArticleListItem, IArticleType } from "@mooncellar/schemas";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: "UTC",
});

const COUNT_FORMAT = new Intl.NumberFormat("en-US");

export const ARTICLE_TYPE_LABELS: Record<IArticleType, string> = {
  news: "Site news",
  game: "Game article",
};

export const NEWS_HREF = "/news";

export const getArticleHref = (slug: string) => `${NEWS_HREF}/${slug}`;

export const formatArticleDate = (value?: string | null) =>
  value ? DATE_FORMAT.format(new Date(value)) : "";

export const formatArticleViewCount = (views: number) =>
  COUNT_FORMAT.format(views);

export const formatArticleViews = (views: number) =>
  `${formatArticleViewCount(views)} ${views === 1 ? "view" : "views"}`;

export const formatArchiveMonth = (month: number) =>
  MONTH_FORMAT.format(new Date(Date.UTC(2000, month - 1, 1)));

export const isArticleMediaHidden = (
  article: Pick<IArticleListItem, "game">,
  isAdultHidden: boolean
) => !!article.game?.isAdult && isAdultHidden;

export const getArticleImage = (
  article: Pick<IArticleListItem, "image" | "game">,
  isAdultHidden: boolean
) =>
  isArticleMediaHidden(article, isAdultHidden)
    ? null
    : (article.image ?? article.game?.artwork ?? null);
