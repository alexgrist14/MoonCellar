import { createZodDto } from "nestjs-zod";
import {
  IgdbOrphansRunSchema,
  StartIgdbOrphansRequestSchema,
} from "@mooncellar/schemas";

export class StartIgdbOrphansRequestDto extends createZodDto(
  StartIgdbOrphansRequestSchema
) {}

export class IgdbOrphansRunDto extends createZodDto(IgdbOrphansRunSchema) {}
