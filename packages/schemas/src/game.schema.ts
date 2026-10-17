import { z } from "zod";
import { GameAccountSchema } from "./game-auth.schema";

export const GameHealthSchema = z.object({
  status: z.literal("ok"),
  database: z.enum(["up", "down"]),
  uptimeSeconds: z.number().int().nonnegative(),
});
export type IGameHealth = z.infer<typeof GameHealthSchema>;

export const GAME_SLUG_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
export const GAME_BOARD_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;
export const GAME_REPLAY_MAX_BYTES = 256 * 1024;

const gameSlug = z.string().regex(GAME_SLUG_PATTERN);
const boardId = z.string().regex(GAME_BOARD_PATTERN);
const objectId = z.string().regex(/^[0-9a-f]{24}$/);
const replay = z
  .base64()
  .min(1)
  .max(Math.ceil(GAME_REPLAY_MAX_BYTES / 3) * 4);

export const GameDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  scoreOrder: z.enum(["asc", "desc"]),
  scoreUnit: z.enum(["ms", "points"]),
  replayRequired: z.boolean(),
});
export type IGameDefinitionInfo = z.infer<typeof GameDefinitionSchema>;

export const GameParamsSchema = z.object({ game: gameSlug });
export type IGameParams = z.infer<typeof GameParamsSchema>;

export const GameBoardParamsSchema = z.object({
  game: gameSlug,
  board: boardId,
});
export type IGameBoardParams = z.infer<typeof GameBoardParamsSchema>;

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
  score: z.number().int(),
  hasReplay: z.boolean(),
  recordedAt: z.string(),
});
export type IGameLeaderboardEntry = z.infer<typeof GameLeaderboardEntrySchema>;

export const GameLeaderboardSchema = z.object({
  game: z.string(),
  board: z.string(),
  total: z.number().int().nonnegative(),
  entries: z.array(GameLeaderboardEntrySchema),
});
export type IGameLeaderboard = z.infer<typeof GameLeaderboardSchema>;

export const GameSubmitScoreSchema = z.object({
  score: z.number().int().min(-1_000_000_000).max(1_000_000_000),
  replay: replay.optional(),
});
export type IGameSubmitScore = z.infer<typeof GameSubmitScoreSchema>;

export const GameSubmitResultSchema = z.object({
  improved: z.boolean(),
  entry: GameLeaderboardEntrySchema,
});
export type IGameSubmitResult = z.infer<typeof GameSubmitResultSchema>;

export const GameEntryParamsSchema = z.object({
  game: gameSlug,
  entryId: objectId,
});
export type IGameEntryParams = z.infer<typeof GameEntryParamsSchema>;

export const GameReplaySchema = z.object({
  entryId: z.string(),
  game: z.string(),
  board: z.string(),
  userId: z.string(),
  displayName: z.string(),
  score: z.number().int(),
  replay: z.string(),
});
export type IGameReplay = z.infer<typeof GameReplaySchema>;

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
  toUserId: objectId,
  board: boardId,
  score: z.number().int().min(-1_000_000_000).max(1_000_000_000),
  comment: z.string().trim().max(GAME_CHALLENGE_COMMENT_MAX).default(""),
  replay: replay.optional(),
});
export type IGameChallengeCreate = z.infer<typeof GameChallengeCreateSchema>;

export const GameChallengeParamsSchema = z.object({
  game: gameSlug,
  challengeId: objectId,
});
export type IGameChallengeParams = z.infer<typeof GameChallengeParamsSchema>;

export const GameChallengeSchema = z.object({
  id: z.string(),
  game: z.string(),
  board: z.string(),
  fromUserId: z.string(),
  fromName: z.string(),
  toUserId: z.string(),
  score: z.number().int(),
  comment: z.string(),
  createdAt: z.string(),
});
export type IGameChallenge = z.infer<typeof GameChallengeSchema>;

export const GameChallengeWithReplaySchema = GameChallengeSchema.extend({
  replay: z.string().nullable(),
});
export type IGameChallengeWithReplay = z.infer<
  typeof GameChallengeWithReplaySchema
>;

// Player levels: a level is the game's own map format, opaque to the service except for the
// game's check; it holds only the player's layout and numbers of pieces from the game's data.

export const GAME_LEVEL_MAX_BYTES = 256 * 1024;
export const GAME_LEVEL_NAME_MAX = 64;
export const GAME_LEVEL_DESCRIPTION_MAX = 500;
export const GAME_LEVEL_REPORT_MAX = 300;

const levelData = z
  .base64()
  .min(1)
  .max(Math.ceil(GAME_LEVEL_MAX_BYTES / 3) * 4);

export const GameLevelParamsSchema = z.object({
  game: gameSlug,
  levelId: objectId,
});
export type IGameLevelParams = z.infer<typeof GameLevelParamsSchema>;

export const GameLevelListQuerySchema = z.object({
  sort: z.enum(["new", "best"]).default("new"),
  q: z.string().trim().max(GAME_LEVEL_NAME_MAX).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type IGameLevelListQuery = z.infer<typeof GameLevelListQuerySchema>;

export const GameLevelSchema = z.object({
  id: z.string(),
  game: z.string(),
  name: z.string(),
  description: z.string(),
  base: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  version: z.number().int().positive(),
  board: z.string(),
  size: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  ratings: z.number().int().nonnegative(),
  downloads: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IGameLevel = z.infer<typeof GameLevelSchema>;

export const GameLevelListSchema = z.object({
  game: z.string(),
  total: z.number().int().nonnegative(),
  levels: z.array(GameLevelSchema),
});
export type IGameLevelList = z.infer<typeof GameLevelListSchema>;

export const GameLevelUploadSchema = z.object({
  name: z.string().trim().min(1).max(GAME_LEVEL_NAME_MAX),
  description: z.string().trim().max(GAME_LEVEL_DESCRIPTION_MAX).default(""),
  base: z.string().regex(/^[a-z0-9_]{1,40}$/),
  data: levelData,
});
export type IGameLevelUpload = z.infer<typeof GameLevelUploadSchema>;

export const GameLevelFileSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  data: z.string(),
});
export type IGameLevelFile = z.infer<typeof GameLevelFileSchema>;

export const GameLevelRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
});
export type IGameLevelRating = z.infer<typeof GameLevelRatingSchema>;

export const GameLevelReportSchema = z.object({
  reason: z.string().trim().min(1).max(GAME_LEVEL_REPORT_MAX),
});
export type IGameLevelReport = z.infer<typeof GameLevelReportSchema>;

export const GameLevelReportResultSchema = z.object({
  reported: z.literal(true),
  hidden: z.boolean(),
});
export type IGameLevelReportResult = z.infer<typeof GameLevelReportResultSchema>;

export const GameLevelModerationSchema = z.object({
  hidden: z.boolean(),
});
export type IGameLevelModeration = z.infer<typeof GameLevelModerationSchema>;

export const GameLevelReportedSchema = GameLevelSchema.extend({
  hidden: z.boolean(),
  reports: z.array(
    z.object({ userId: z.string(), reason: z.string(), at: z.string() })
  ),
});
export type IGameLevelReported = z.infer<typeof GameLevelReportedSchema>;
