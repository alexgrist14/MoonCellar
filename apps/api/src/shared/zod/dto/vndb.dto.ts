import { createZodDto } from "nestjs-zod";
import { VndbParseResponseSchema } from "@mooncellar/schemas";

export class VndbParseResponseDto extends createZodDto(
  VndbParseResponseSchema
) {}
