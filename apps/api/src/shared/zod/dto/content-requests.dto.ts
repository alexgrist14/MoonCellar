import { createZodDto } from "nestjs-zod";
import {
  ContentRequestDetailSchema,
  ContentRequestSchema,
  DecideContentRequestResponseSchema,
  DecideContentRequestSchema,
  GetAdminCharactersResponseSchema,
  GetAdminCharactersSchema,
  GetContentRequestsResponseSchema,
  GetContentRequestsSchema,
  SaveCharacterRequestSchema,
} from "@mooncellar/schemas";

export class ContentRequestResponseDto extends createZodDto(
  ContentRequestSchema
) {}

export class ContentRequestsResponseDto extends createZodDto(
  ContentRequestSchema.array()
) {}

export class ContentRequestDetailDto extends createZodDto(
  ContentRequestDetailSchema
) {}

export class GetContentRequestsDto extends createZodDto(
  GetContentRequestsSchema
) {}

export class GetContentRequestsResponseDto extends createZodDto(
  GetContentRequestsResponseSchema
) {}

export class DecideContentRequestDto extends createZodDto(
  DecideContentRequestSchema
) {}

export class DecideContentRequestResponseDto extends createZodDto(
  DecideContentRequestResponseSchema
) {}

export class GetAdminCharactersDto extends createZodDto(
  GetAdminCharactersSchema
) {}

export class GetAdminCharactersResponseDto extends createZodDto(
  GetAdminCharactersResponseSchema
) {}

export class SaveCharacterDto extends createZodDto(SaveCharacterRequestSchema) {}
