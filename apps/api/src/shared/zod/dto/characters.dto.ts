import { createZodDto } from "nestjs-zod";
import {
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
