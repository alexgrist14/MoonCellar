import { createZodDto } from "nestjs-zod";
import {
  FindCharacterPortraitsRequestSchema,
  FindCharacterPortraitsResponseSchema,
  CharacterAiDraftRequestSchema,
  CharacterAiDraftRunSchema,
  CharacterSchema,
  GetCharacterBySlugSchema,
  GetCharactersRequestSchema,
  GetCharactersResponseSchema,
} from "@mooncellar/schemas";

export class GetCharactersDto extends createZodDto(
  GetCharactersRequestSchema
) {}
export class GetCharacterBySlugDto extends createZodDto(
  GetCharacterBySlugSchema
) {}

export class CharacterResponseDto extends createZodDto(CharacterSchema) {}
export class GetCharactersResponseDto extends createZodDto(
  GetCharactersResponseSchema
) {}
export class CharacterAiDraftRunDto extends createZodDto(
  CharacterAiDraftRunSchema
) {}
export class CharacterAiDraftDto extends createZodDto(
  CharacterAiDraftRequestSchema
) {}
export class FindCharacterPortraitsDto extends createZodDto(
  FindCharacterPortraitsRequestSchema
) {}
export class FindCharacterPortraitsResponseDto extends createZodDto(
  FindCharacterPortraitsResponseSchema
) {}
