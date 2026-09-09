import { createZodDto } from "nestjs-zod";
import {
  GetGamesStatsRequestSchema,
  GetGameStatsResponseSchema,
  GetGamesStatsResponseSchema,
} from "@mooncellar/schemas";

export class GetGamesStatsRequestDto extends createZodDto(
  GetGamesStatsRequestSchema
) {}

export class GetGameStatsResponseDto extends createZodDto(
  GetGameStatsResponseSchema
) {}

export class GetGamesStatsResponseDto extends createZodDto(
  GetGamesStatsResponseSchema
) {}
