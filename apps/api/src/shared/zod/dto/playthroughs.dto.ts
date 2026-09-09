import { createZodDto } from "nestjs-zod";
import {
  GetPlaythroughsRequestSchema,
  PlaythroughFullResponseSchema,
  PlaythroughMinimalResponseSchema,
  PlaythroughsMinimalResponseSchema,
  PlaythroughsResponseSchema,
  SavePlaythroughRequestSchema,
  UpdatePlaythroughRequestSchema,
} from "../schemas/playthroughs.schema";

export class GetPlaythroughsRequestDto extends createZodDto(
  GetPlaythroughsRequestSchema
) {}

export class SavePlaythroughRequestDto extends createZodDto(
  SavePlaythroughRequestSchema
) {}

export class UpdatePlaythroughsRequestDto extends createZodDto(
  UpdatePlaythroughRequestSchema
) {}

export class GetPlaythroughsResponseDto extends createZodDto(
  PlaythroughsResponseSchema
) {}

export class GetPlaythroughsMinimalResponseDto extends createZodDto(
  PlaythroughsMinimalResponseSchema
) {}

export class GetPlaythroughFullResponseDto extends createZodDto(
  PlaythroughFullResponseSchema
) {}

export class GetPlaythroughMinimalResponseDto extends createZodDto(
  PlaythroughMinimalResponseSchema
) {}
