import { createZodDto } from "nestjs-zod";
import { PlatformSchema } from "@mooncellar/schemas";

export class PlatformResponseDto extends createZodDto(PlatformSchema) {}
