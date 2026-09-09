import { createZodDto } from "nestjs-zod";
import {
  GetFileRequestSchema,
  GetFileResponseSchema,
} from "../schemas/files.schema";

export class GetFileRequestDto extends createZodDto(GetFileRequestSchema) {}
export class GetFileResponseDto extends createZodDto(GetFileResponseSchema) {}
