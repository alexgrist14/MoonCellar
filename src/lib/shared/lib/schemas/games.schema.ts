import { z } from "zod";

export const RetroachievementsSchema = z.object({
  gameId: z.number(),
  consoleId: z.number(),
});

export const GameFiltersSchema = z.object({
  genres: z.string().array().or(z.string().nullish()).optional(),
  platforms: z.string().array().or(z.string().nullish()).optional(),
  modes: z.string().array().or(z.string().nullish()).optional(),
  keywords: z.string().array().or(z.string().nullish()).optional(),
  themes: z.string().array().or(z.string().nullish()).optional(),
  types: z.string().array().or(z.string().nullish()).optional(),
});

export const ReleaseDateSchema = z.object({
  date: z.number(),
  human: z.string(),
  month: z.number(),
  year: z.number(),
  platformId: z.string(),
  region: z.string(),
});

export const GameSchema = z.object({
  _id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.string(),
  cover: z.string().nullable(),
  storyline: z.string().optional(),
  summary: z.string().optional(),
  modes: z.string().array().optional(),
  genres: z.string().array().optional(),
  keywords: z.string().array().optional(),
  themes: z.string().array().optional(),
  screenshots: z.string().array().optional(),
  artworks: z.string().array().optional(),
  companies: z.string().array().optional(),
  websites: z.string().array().optional(),
  first_release: z.number().optional(),
  release_dates: ReleaseDateSchema.array().optional(),
  platformIds: z.string().array(),
  retroachievements: RetroachievementsSchema.array().optional(),
  igdbIds: z.number().array().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetGameBySlugSchema = z.object({
  slug: z.string(),
});

export const GetGameByIdSchema = z.object({
  _id: z.string(),
});

export const GetGamesByIdsSchema = z.object({
  _ids: z.string().array(),
});

export const GetGamesRequestShema = z.object({
  take: z.coerce.number().min(1).max(100).default(50).optional(),
  isRandom: z
    .union([z.string(), z.boolean()])
    .transform((val) =>
      typeof val === "boolean"
        ? val
        : ["false", "0", "no"].includes(val.toLowerCase())
          ? false
          : Boolean(val)
    )
    .optional(),
  isOnlyWithAchievements: z
    .union([z.string(), z.boolean()])
    .transform((val) =>
      typeof val === "boolean"
        ? val
        : ["false", "0", "no"].includes(val.toLowerCase())
          ? false
          : Boolean(val)
    )
    .optional(),
  page: z.coerce.number().min(1).default(1).optional(),
  selected: GameFiltersSchema.optional(),
  excluded: GameFiltersSchema.optional(),
  search: z.string().optional(),
  company: z.string().optional(),
  years: z
    .tuple([
      z.coerce.number().min(1900).max(2100),
      z.coerce.number().min(1900).max(2100),
    ])
    .optional(),
  mode: z.enum(["any", "all"]).default("any").optional(),
  excludeGames: z.string().array().optional(),
});

export const AddGameRequestShema = GameSchema.omit({
  _id: true,
  updatedAt: true,
  createdAt: true,
});

export const UpdateGameRequestShema = GameSchema.omit({
  _id: true,
  updatedAt: true,
  createdAt: true,
});

export const GetCustomGameResponseSchema = GameSchema.array();

export type IRetroachievementsField = z.infer<typeof RetroachievementsSchema>;
export type IGameFilters = z.infer<typeof GameFiltersSchema>;
export type IReleaseDate = z.infer<typeof ReleaseDateSchema>;

export type IAddGameRequest = z.infer<typeof AddGameRequestShema>;
export type IUpdateGameRequest = z.infer<typeof UpdateGameRequestShema>;
export type IGetGamesRequest = z.infer<typeof GetGamesRequestShema>;
export type IGetGameByIdRequest = z.infer<typeof GetGameByIdSchema>;
export type IGetGameBySlugRequest = z.infer<typeof GetGameBySlugSchema>;
export type IGetGamesByIdsRequest = z.infer<typeof GetGamesByIdsSchema>;

export type IGameResponse = z.infer<typeof GameSchema>;
