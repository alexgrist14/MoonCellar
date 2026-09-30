import { createZodDto } from "nestjs-zod";
import {
  GenerateImageRequestSchema,
  GenerateImageResponseSchema,
  GeneratedImageSchema,
  SaveGeneratedImageRequestSchema,
  SuggestImageElementsRequestSchema,
  SuggestImageElementsResponseSchema,
} from "@mooncellar/schemas";

export class GenerateImageRequestDto extends createZodDto(
  GenerateImageRequestSchema
) {}

export class GenerateImageResponseDto extends createZodDto(
  GenerateImageResponseSchema
) {}

export class SaveGeneratedImageRequestDto extends createZodDto(
  SaveGeneratedImageRequestSchema
) {}

export class GeneratedImageDto extends createZodDto(GeneratedImageSchema) {}

export class SuggestImageElementsRequestDto extends createZodDto(
  SuggestImageElementsRequestSchema
) {}

export class SuggestImageElementsResponseDto extends createZodDto(
  SuggestImageElementsResponseSchema
) {}
