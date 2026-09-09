import { createZodDto } from "nestjs-zod";
import {
  GetFileRequestSchema,
  GetFileResponseSchema,
} from "@mooncellar/schemas";

export class GetFileRequestDto extends createZodDto(GetFileRequestSchema) {}
export class GetFileResponseDto extends createZodDto(GetFileResponseSchema) {}
