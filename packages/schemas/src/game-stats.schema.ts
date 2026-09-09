import { z } from "zod";

export const GameStatsSchema = z.object({
  gameId: z.string().nonempty().describe("Game id"),
  players: z
    .number()
    .int()
    .min(0)
    .describe("Users with at least one playthrough"),
  mastered: z.number().int().min(0).describe("Users who mastered the game"),
  completed: z.number().int().min(0).describe("Users who completed the game"),
  playing: z.number().int().min(0).describe("Users playing the game"),
  backlog: z.number().int().min(0).describe("Users with the game in backlog"),
  wishlist: z.number().int().min(0).describe("Users with the game in wishlist"),
  dropped: z.number().int().min(0).describe("Users who dropped the game"),
  played: z.number().int().min(0).describe("Users who played the game"),
});

export const GetGamesStatsRequestSchema = z.object({
  gameIds: z.string().nonempty().array().min(1).max(100).describe("Game ids"),
});

export const GetGameStatsResponseSchema = GameStatsSchema;
export const GetGamesStatsResponseSchema = GameStatsSchema.array();

export type IGameStats = z.infer<typeof GameStatsSchema>;
export type IGetGamesStatsRequest = z.infer<typeof GetGamesStatsRequestSchema>;
export type IGetGameStatsResponse = z.infer<typeof GetGameStatsResponseSchema>;
export type IGetGamesStatsResponse = z.infer<
  typeof GetGamesStatsResponseSchema
>;
