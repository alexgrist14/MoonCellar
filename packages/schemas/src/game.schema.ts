import { z } from "zod";

export const GameHealthSchema = z.object({
  status: z.literal("ok"),
  database: z.enum(["up", "down"]),
  uptimeSeconds: z.number().int().nonnegative(),
});
export type IGameHealth = z.infer<typeof GameHealthSchema>;

export const GameLevelParamsSchema = z.object({
  level: z.coerce.number().int().min(0).max(99),
});
export type IGameLevelParams = z.infer<typeof GameLevelParamsSchema>;

export const GameLeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type IGameLeaderboardQuery = z.infer<typeof GameLeaderboardQuerySchema>;

export const GameLeaderboardEntrySchema = z.object({
  entryId: z.string(),
  rank: z.number().int().positive(),
  userId: z.string(),
  displayName: z.string(),
  timeMs: z.number().int().positive(),
  hasGhost: z.boolean(),
  recordedAt: z.string(),
});
export type IGameLeaderboardEntry = z.infer<typeof GameLeaderboardEntrySchema>;

export const GameLeaderboardSchema = z.object({
  level: z.number().int().min(0),
  total: z.number().int().nonnegative(),
  entries: z.array(GameLeaderboardEntrySchema),
});
export type IGameLeaderboard = z.infer<typeof GameLeaderboardSchema>;

export const GAME_GHOST_MAX_BYTES = 256 * 1024;

export const GameSubmitTimeSchema = z.object({
  timeMs: z.number().int().positive().max(3_600_000),
  ghost: z
    .base64()
    .max(Math.ceil(GAME_GHOST_MAX_BYTES / 3) * 4)
    .optional(),
});
export type IGameSubmitTime = z.infer<typeof GameSubmitTimeSchema>;

export const GameSubmitResultSchema = z.object({
  improved: z.boolean(),
  entry: GameLeaderboardEntrySchema,
});
export type IGameSubmitResult = z.infer<typeof GameSubmitResultSchema>;

export const GameEntryParamsSchema = z.object({
  entryId: z.string().regex(/^[0-9a-f]{24}$/),
});
export type IGameEntryParams = z.infer<typeof GameEntryParamsSchema>;

export const GameGhostSchema = z.object({
  entryId: z.string(),
  level: z.number().int().min(0),
  userId: z.string(),
  displayName: z.string(),
  timeMs: z.number().int().positive(),
  ghost: z.string(),
});
export type IGameGhost = z.infer<typeof GameGhostSchema>;
