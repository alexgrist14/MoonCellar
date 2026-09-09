import { createZodDto } from "nestjs-zod";
import {
  AddGameRequestSchema,
  GameSchema,
  GetGameByIdSchema,
  GetGameBySlugSchema,
  GetGamesByIdsSchema,
  GetGamesRequestSchema,
  GetGameSlugsRequestSchema,
  GetGameSlugsResponseSchema,
  GetRandomGameSlugResponseSchema,
  UpdateGameRequestSchema,
} from "../schemas/games.schema";

export class GetGameByIdDto extends createZodDto(GetGameByIdSchema) {}
export class GetGameBySlugDto extends createZodDto(GetGameBySlugSchema) {}
export class GetGamesByIdsDto extends createZodDto(GetGamesByIdsSchema) {}
export class GetGamesDto extends createZodDto(GetGamesRequestSchema) {}
export class GetGameSlugsDto extends createZodDto(GetGameSlugsRequestSchema) {}
export class AddGameDto extends createZodDto(AddGameRequestSchema) {}
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
