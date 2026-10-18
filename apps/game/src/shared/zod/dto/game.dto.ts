import { createZodDto } from "nestjs-zod";
import {
  GameAccountSchema,
  GameAchievementIconParamsSchema,
  GameAchievementListSchema,
  GameAchievementParamsSchema,
  GameAchievementPlayerParamsSchema,
  GameAchievementReportSchema,
  GamePlayerAchievementSchema,
  GamePlayerAchievementsSchema,
  GamePlayerGameAchievementsSchema,
  GamePlayerParamsSchema,
  GameBoardParamsSchema,
  GameChallengeCreateSchema,
  GameChallengeParamsSchema,
  GameChallengeSchema,
  GameChallengeWithReplaySchema,
  GameDefinitionSchema,
  GameDeviceCodeRequestSchema,
  GameDeviceCodeSchema,
  GameDeviceTokenRequestSchema,
  GameDeviceTokenSchema,
  GameEntryParamsSchema,
  GameHealthSchema,
  GameLeaderboardQuerySchema,
  GameLeaderboardSchema,
  GameLevelFileSchema,
  GameLevelListQuerySchema,
  GameLevelListSchema,
  GameLevelModerationSchema,
  GameLevelParamsSchema,
  GameLevelRatingSchema,
  GameLevelReportResultSchema,
  GameLevelReportSchema,
  GameLevelReportedSchema,
  GameLevelSchema,
  GameLevelUploadSchema,
  GameParamsSchema,
  GameReplaySchema,
  GameSubmitResultSchema,
  GameSubmitScoreSchema,
  GameStorageFileQuerySchema,
  GameStorageFileSchema,
  GameStorageListSchema,
  GameStorageParamsSchema,
  GameStorageWriteQuerySchema,
  GameStorageWriteResultSchema,
} from "@mooncellar/schemas";

export class GameHealthDto extends createZodDto(GameHealthSchema) {}

export class GameAccountDto extends createZodDto(GameAccountSchema) {}

export class GameDeviceCodeRequestDto extends createZodDto(
  GameDeviceCodeRequestSchema
) {}

export class GameDeviceCodeDto extends createZodDto(GameDeviceCodeSchema) {}

export class GameDeviceTokenRequestDto extends createZodDto(
  GameDeviceTokenRequestSchema
) {}

export class GameDeviceTokenDto extends createZodDto(GameDeviceTokenSchema) {}

export class GameDefinitionDto extends createZodDto(GameDefinitionSchema) {}

export class GameParamsDto extends createZodDto(GameParamsSchema) {}

export class GameBoardParamsDto extends createZodDto(GameBoardParamsSchema) {}

export class GameLeaderboardQueryDto extends createZodDto(
  GameLeaderboardQuerySchema
) {}

export class GameLeaderboardDto extends createZodDto(GameLeaderboardSchema) {}

export class GameSubmitScoreDto extends createZodDto(GameSubmitScoreSchema) {}

export class GameSubmitResultDto extends createZodDto(GameSubmitResultSchema) {}

export class GameEntryParamsDto extends createZodDto(GameEntryParamsSchema) {}

export class GameReplayDto extends createZodDto(GameReplaySchema) {}

export class GameChallengeCreateDto extends createZodDto(
  GameChallengeCreateSchema
) {}

export class GameChallengeParamsDto extends createZodDto(
  GameChallengeParamsSchema
) {}

export class GameChallengeDto extends createZodDto(GameChallengeSchema) {}

export class GameChallengeWithReplayDto extends createZodDto(
  GameChallengeWithReplaySchema
) {}

export class GameLevelParamsDto extends createZodDto(GameLevelParamsSchema) {}

export class GameLevelListQueryDto extends createZodDto(
  GameLevelListQuerySchema
) {}

export class GameLevelDto extends createZodDto(GameLevelSchema) {}

export class GameLevelListDto extends createZodDto(GameLevelListSchema) {}

export class GameLevelUploadDto extends createZodDto(GameLevelUploadSchema) {}

export class GameLevelFileDto extends createZodDto(GameLevelFileSchema) {}

export class GameLevelRatingDto extends createZodDto(GameLevelRatingSchema) {}

export class GameLevelReportDto extends createZodDto(GameLevelReportSchema) {}

export class GameLevelReportResultDto extends createZodDto(
  GameLevelReportResultSchema
) {}

export class GameLevelModerationDto extends createZodDto(
  GameLevelModerationSchema
) {}

export class GameLevelReportedDto extends createZodDto(GameLevelReportedSchema) {}

export class GameStorageParamsDto extends createZodDto(GameStorageParamsSchema) {}

export class GameStorageFileQueryDto extends createZodDto(
  GameStorageFileQuerySchema
) {}

export class GameStorageWriteQueryDto extends createZodDto(
  GameStorageWriteQuerySchema
) {}

export class GameStorageFileDto extends createZodDto(GameStorageFileSchema) {}

export class GameStorageListDto extends createZodDto(GameStorageListSchema) {}

export class GameStorageWriteResultDto extends createZodDto(
  GameStorageWriteResultSchema
) {}

export class GameAchievementListDto extends createZodDto(
  GameAchievementListSchema
) {}

export class GameAchievementParamsDto extends createZodDto(
  GameAchievementParamsSchema
) {}

export class GameAchievementIconParamsDto extends createZodDto(
  GameAchievementIconParamsSchema
) {}

export class GameAchievementPlayerParamsDto extends createZodDto(
  GameAchievementPlayerParamsSchema
) {}

export class GamePlayerParamsDto extends createZodDto(GamePlayerParamsSchema) {}

export class GameAchievementReportDto extends createZodDto(
  GameAchievementReportSchema
) {}

export class GamePlayerAchievementDto extends createZodDto(
  GamePlayerAchievementSchema
) {}

export class GamePlayerAchievementsDto extends createZodDto(
  GamePlayerAchievementsSchema
) {}

export class GamePlayerGameAchievementsDto extends createZodDto(
  GamePlayerGameAchievementsSchema
) {}
