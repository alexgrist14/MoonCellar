import { createZodDto } from "nestjs-zod";
import {
  AddGameRequestSchema,
  GameAiDraftRequestSchema,
  GameAiDraftRunSchema,
  GameSchema,
  GetGameByIdSchema,
  GetGameBySlugSchema,
  GetGamesByIdsSchema,
  GetGamesRequestSchema,
  GetGameSlugsRequestSchema,
  GetGameSlugsResponseSchema,
  GetRandomGameSlugResponseSchema,
  GetRelatedGamesResponseSchema,
  UpdateGameRequestSchema,
} from "@mooncellar/schemas";

export class GetGameByIdDto extends createZodDto(GetGameByIdSchema) {}
export class GetGameBySlugDto extends createZodDto(GetGameBySlugSchema) {}
export class GetGamesByIdsDto extends createZodDto(GetGamesByIdsSchema) {}
export class GetGamesDto extends createZodDto(GetGamesRequestSchema) {}
export class GetGameSlugsDto extends createZodDto(GetGameSlugsRequestSchema) {}
export class AddGameDto extends createZodDto(AddGameRequestSchema) {}
export class GameAiDraftDto extends createZodDto(GameAiDraftRequestSchema) {}
export class GameAiDraftRunDto extends createZodDto(GameAiDraftRunSchema) {}
export class UpdateGameDto extends createZodDto(UpdateGameRequestSchema) {}

export class GameResponseDto extends createZodDto(GameSchema) {}
export class GetGameResponseDto extends createZodDto(GameSchema) {}
export class GetGamesResponseDto extends createZodDto(GameSchema.array()) {}
export class GetGameSlugsResponseDto extends createZodDto(
  GetGameSlugsResponseSchema
) {}
export class GetRandomGameSlugResponseDto extends createZodDto(
  GetRandomGameSlugResponseSchema
) {}

export class GetRelatedGamesResponseDto extends createZodDto(
  GetRelatedGamesResponseSchema
) {}
