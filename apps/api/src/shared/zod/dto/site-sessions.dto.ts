import { createZodDto } from "nestjs-zod";
import {
  SaveSiteSessionRequestSchema,
  SiteSessionSchema,
  TestSiteSessionResponseSchema,
} from "@mooncellar/schemas";

export class SaveSiteSessionDto extends createZodDto(
  SaveSiteSessionRequestSchema
) {}

export class SiteSessionDto extends createZodDto(SiteSessionSchema) {}

export class TestSiteSessionResponseDto extends createZodDto(
  TestSiteSessionResponseSchema
) {}
