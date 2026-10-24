import { z } from "zod";
import { CommunityAuthorSchema } from "./comments.schema";
import { ObjectIdSchema } from "./utils";

export const ARTICLE_TITLE_MIN = 3;
export const ARTICLE_TITLE_MAX = 120;
export const ARTICLE_SUMMARY_MAX = 300;
export const ARTICLE_TEXT_LIMIT = 30000;
export const ARTICLE_CONTENT_MAX = 300000;
export const ARTICLES_PAGE_SIZE = 10;
export const ARTICLES_TAKE_MAX = 50;

export const ArticleTypeSchema = z.enum(["news", "game"]);
export const ArticleStatusSchema = z.enum(["draft", "published"]);

export const ArticleGameSchema = z.object({
  _id: z.string().describe("Game id"),
  slug: z.string().describe("Game slug"),
  name: z.string().describe("Game name"),
  cover: z.string().nullable().describe("Cover URL"),
  artwork: z
    .string()
    .nullable()
    .describe("First artwork or screenshot, used when the post has no image"),
  year: z.number().nullable().describe("Year of the first release"),
  isAdult: z.boolean().describe("The game carries the adult theme"),
});

export const ArticleSchema = z.object({
  _id: z.string().describe("Post id"),
  slug: z.string().describe("Post slug, unique across posts"),
  type: ArticleTypeSchema.describe("Site news, or an article about one game"),
  status: ArticleStatusSchema.describe("Drafts are visible to admins only"),
  title: z.string().describe("Title"),
  summary: z.string().describe("Short text shown in the feed and previews"),
  image: z.string().nullable().describe("Image URL"),
  content: z.string().describe("Sanitised HTML text"),
  game: ArticleGameSchema.nullable().describe("The game of a game article"),
  author: CommunityAuthorSchema.nullable().describe("Author"),
  readingMinutes: z.number().describe("Estimated reading time in minutes"),
  publishedAt: z.string().nullable().describe("Date of the first publication"),
  createdAt: z.string().describe("Creation date"),
  updatedAt: z.string().describe("Last update date"),
});

export const ArticleListItemSchema = ArticleSchema.omit({ content: true });

const ArticleViewsSchema = z.object({
  views: z
    .number()
    .describe(
      "Opens of the published post, one per visitor visit; admins only"
    ),
});

export const AdminArticleSchema = ArticleSchema.extend(
  ArticleViewsSchema.shape
);

export const AdminArticleListItemSchema = ArticleListItemSchema.extend(
  ArticleViewsSchema.shape
);

export const ArticleCountsSchema = z.object({
  all: z.number().describe("Posts of every kind"),
  news: z.number().describe("Site news"),
  game: z.number().describe("Game articles"),
});

export const GetArticlesRequestSchema = z.object({
  type: ArticleTypeSchema.optional().describe("Kind of post"),
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(3000)
    .optional()
    .describe("Year of publication"),
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe("Month of publication, 1 to 12; needs a year"),
  game: ObjectIdSchema.optional().describe("Posts about this game"),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(ARTICLES_TAKE_MAX)
    .default(ARTICLES_PAGE_SIZE),
});

export const GetArticlesResponseSchema = z.object({
  results: ArticleListItemSchema.array(),
  total: z.number().describe("Posts matching every filter"),
  counts: ArticleCountsSchema.describe(
    "Posts per kind under the same date and game filters"
  ),
});

export const ArticleArchiveMonthSchema = z.object({
  month: z.number().describe("Month, 1 to 12"),
  count: z.number().describe("Posts published that month"),
});

export const ArticleArchiveYearSchema = z.object({
  year: z.number().describe("Year"),
  count: z.number().describe("Posts published that year"),
  months: ArticleArchiveMonthSchema.array().describe(
    "Months with posts, newest first"
  ),
});

export const ArticleArchiveSchema = z.object({
  total: z.number().describe("Published posts"),
  years: ArticleArchiveYearSchema.array().describe(
    "Years with posts, newest first"
  ),
});

export const GetArticleBySlugRequestSchema = z.object({
  slug: z.string().trim().min(1).max(200).describe("Post slug"),
});

export const ArticleSlugSchema = z.object({
  slug: z.string(),
  updatedAt: z.string(),
});

export const GetArticleSlugsResponseSchema = ArticleSlugSchema.array();

export const GetAdminArticlesRequestSchema = z.object({
  status: ArticleStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(ARTICLES_TAKE_MAX)
    .default(ARTICLES_TAKE_MAX),
});

export const GetAdminArticlesResponseSchema = z.object({
  results: AdminArticleListItemSchema.array(),
  total: z.number(),
});

export const SaveArticleRequestSchema = z
  .object({
    type: ArticleTypeSchema,
    status: ArticleStatusSchema,
    title: z
      .string()
      .trim()
      .min(ARTICLE_TITLE_MIN)
      .max(ARTICLE_TITLE_MAX)
      .describe("Title"),
    summary: z
      .string()
      .trim()
      .min(1, "Write a summary for the feed")
      .max(ARTICLE_SUMMARY_MAX)
      .describe("Short text shown in the feed and previews"),
    image: z
      .string()
      .trim()
      .url()
      .max(1000)
      .nullable()
      .describe("Image uploaded to the Space; null uses the game's artwork"),
    content: z.string().max(ARTICLE_CONTENT_MAX).describe("HTML text"),
    gameId: ObjectIdSchema.nullable().describe("Required for a game article"),
  })
  .refine((article) => article.type !== "game" || !!article.gameId, {
    message: "Pick the game this article is about",
    path: ["gameId"],
  });

export type IArticleType = z.infer<typeof ArticleTypeSchema>;
export type IArticleStatus = z.infer<typeof ArticleStatusSchema>;
export type IArticleGame = z.infer<typeof ArticleGameSchema>;
export type IArticle = z.infer<typeof ArticleSchema>;
export type IArticleListItem = z.infer<typeof ArticleListItemSchema>;
export type IAdminArticle = z.infer<typeof AdminArticleSchema>;
export type IAdminArticleListItem = z.infer<typeof AdminArticleListItemSchema>;
export type IArticleCounts = z.infer<typeof ArticleCountsSchema>;
export type IGetArticlesRequest = z.input<typeof GetArticlesRequestSchema>;
export type IGetArticlesQuery = z.infer<typeof GetArticlesRequestSchema>;
export type IGetArticlesResponse = z.infer<typeof GetArticlesResponseSchema>;
export type IArticleArchive = z.infer<typeof ArticleArchiveSchema>;
export type IArticleArchiveYear = z.infer<typeof ArticleArchiveYearSchema>;
export type IGetArticleBySlugRequest = z.infer<
  typeof GetArticleBySlugRequestSchema
>;
export type IGetArticleSlugsResponse = z.infer<
  typeof GetArticleSlugsResponseSchema
>;
export type IGetAdminArticlesRequest = z.input<
  typeof GetAdminArticlesRequestSchema
>;
export type IGetAdminArticlesQuery = z.infer<
  typeof GetAdminArticlesRequestSchema
>;
export type IGetAdminArticlesResponse = z.infer<
  typeof GetAdminArticlesResponseSchema
>;
export type ISaveArticleRequest = z.infer<typeof SaveArticleRequestSchema>;
