import { createZodDto } from "nestjs-zod";
import {
  GameAccountSchema,
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
  GameParamsSchema,
  GameReplaySchema,
  GameSubmitResultSchema,
  GameSubmitScoreSchema,
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
