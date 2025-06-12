import { z } from "zod";

export const GameSchema = z.object({
  _id: z.number(),
  game_modes: z.number().array(),
  genres: z.number().array(),
  name: z.string(),
  platforms: z.number().array(),
  slug: z.string(),
  url: z.string(),
  keywords: z.number().array(),
  themes: z.number().array(),
  cover: z.number().array(),
  screenshots: z.number().array(),
  total_rating: z.number(),
  total_rating_count: z.number(),
  aggregated_rating: z.number(),
  category: z.number(),
  artworks: z.number().array(),
  storyline: z.string(),
  summary: z.string(),
  first_release_date: z.number(),
  involved_companies: z.number().array(),
  websites: z.number().array(),
  release_dates: z.number().array(),
  raIds: z.number().array(),
});

export const GetGamesByIdsSchema = z.object({
  _ids: z.coerce.number().array(),
});

export type IGetGamesByIdsRequest = z.infer<typeof GetGamesByIdsSchema>;
