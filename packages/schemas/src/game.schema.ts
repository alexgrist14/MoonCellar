import { z } from "zod";
import { GameAccountSchema } from "./game-auth.schema";

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
    .min(1)
    .max(Math.ceil(GAME_GHOST_MAX_BYTES / 3) * 4),
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

export const GAME_SIGNAL_MAX_BYTES = 4096;

export const GameSignalClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("host"),
    port: z.number().int().min(0).max(65535).default(0),
  }),
  z.object({
    type: z.literal("join"),
    code: z.string().trim().min(1).max(8),
    port: z.number().int().min(0).max(65535).default(0),
  }),
  z.object({
    type: z.literal("signal"),
    data: z.string().max(GAME_SIGNAL_MAX_BYTES),
  }),
  z.object({ type: z.literal("leave") }),
]);
export type IGameSignalClientMessage = z.infer<
  typeof GameSignalClientMessageSchema
>;

export const GameSignalPeerSchema = z.object({
  name: z.string(),
  address: z.string(),
  port: z.number().int(),
});
export type IGameSignalPeer = z.infer<typeof GameSignalPeerSchema>;

export const GameSignalServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hosted"), code: z.string() }),
  z.object({
    type: z.literal("joined"),
    code: z.string(),
    peer: GameSignalPeerSchema,
  }),
  z.object({ type: z.literal("peer"), peer: GameSignalPeerSchema }),
  z.object({ type: z.literal("signal"), data: z.string() }),
  z.object({ type: z.literal("left") }),
  z.object({ type: z.literal("closed") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type IGameSignalServerMessage = z.infer<
  typeof GameSignalServerMessageSchema
>;

export const GameFriendSchema = GameAccountSchema;
export type IGameFriend = z.infer<typeof GameFriendSchema>;

export const GAME_CHALLENGE_COMMENT_MAX = 255;

export const GameChallengeCreateSchema = z.object({
  toUserId: z.string().regex(/^[0-9a-f]{24}$/),
  level: z.number().int().min(0).max(99),
  timeMs: z.number().int().positive().max(3_600_000),
  comment: z.string().trim().max(GAME_CHALLENGE_COMMENT_MAX).default(""),
  ghost: z
    .base64()
    .min(1)
    .max(Math.ceil(GAME_GHOST_MAX_BYTES / 3) * 4),
});
export type IGameChallengeCreate = z.infer<typeof GameChallengeCreateSchema>;

export const GameChallengeParamsSchema = z.object({
  challengeId: z.string().regex(/^[0-9a-f]{24}$/),
});
export type IGameChallengeParams = z.infer<typeof GameChallengeParamsSchema>;

export const GameChallengeSchema = z.object({
  id: z.string(),
  fromUserId: z.string(),
  fromName: z.string(),
  toUserId: z.string(),
  level: z.number().int().min(0),
  timeMs: z.number().int().positive(),
  comment: z.string(),
  createdAt: z.string(),
});
export type IGameChallenge = z.infer<typeof GameChallengeSchema>;

export const GameChallengeWithGhostSchema = GameChallengeSchema.extend({
  ghost: z.string(),
});
export type IGameChallengeWithGhost = z.infer<
  typeof GameChallengeWithGhostSchema
>;
