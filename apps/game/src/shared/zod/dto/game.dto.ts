import { createZodDto } from "nestjs-zod";
import {
  GameAccountSchema,
  GameDeviceCodeRequestSchema,
  GameDeviceCodeSchema,
  GameDeviceTokenRequestSchema,
  GameDeviceTokenSchema,
  GameEntryParamsSchema,
  GameGhostSchema,
  GameHealthSchema,
  GameLeaderboardQuerySchema,
  GameLeaderboardSchema,
  GameLevelParamsSchema,
  GameSubmitResultSchema,
  GameSubmitTimeSchema,
} from "@mooncellar/schemas";

export class GameHealthDto extends createZodDto(GameHealthSchema) {}

export class GameLevelParamsDto extends createZodDto(GameLevelParamsSchema) {}

export class GameLeaderboardQueryDto extends createZodDto(
  GameLeaderboardQuerySchema
) {}

export class GameLeaderboardDto extends createZodDto(GameLeaderboardSchema) {}

export class GameSubmitTimeDto extends createZodDto(GameSubmitTimeSchema) {}

export class GameSubmitResultDto extends createZodDto(GameSubmitResultSchema) {}

export class GameEntryParamsDto extends createZodDto(GameEntryParamsSchema) {}

export class GameGhostDto extends createZodDto(GameGhostSchema) {}

export class GameAccountDto extends createZodDto(GameAccountSchema) {}

export class GameDeviceCodeRequestDto extends createZodDto(
  GameDeviceCodeRequestSchema
) {}

export class GameDeviceCodeDto extends createZodDto(GameDeviceCodeSchema) {}

export class GameDeviceTokenRequestDto extends createZodDto(
  GameDeviceTokenRequestSchema
) {}

export class GameDeviceTokenDto extends createZodDto(GameDeviceTokenSchema) {}
