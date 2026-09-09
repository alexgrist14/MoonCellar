import { createZodDto } from "nestjs-zod";
import { PlatformSchema } from "../schemas/platforms.schema";

export class PlatformResponseDto extends createZodDto(PlatformSchema) {}
