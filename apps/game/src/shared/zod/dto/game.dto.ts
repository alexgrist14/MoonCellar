import { createZodDto } from "nestjs-zod";
import {
  GameHealthSchema,
  GameLeaderboardQuerySchema,
  GameLeaderboardSchema,
  GameLevelParamsSchema,
} from "@mooncellar/schemas";

export class GameHealthDto extends createZodDto(GameHealthSchema) {}

export class GameLevelParamsDto extends createZodDto(GameLevelParamsSchema) {}

export class GameLeaderboardQueryDto extends createZodDto(
  GameLeaderboardQuerySchema
) {}

export class GameLeaderboardDto extends createZodDto(GameLeaderboardSchema) {}
