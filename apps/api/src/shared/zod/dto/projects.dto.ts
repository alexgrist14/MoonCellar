import { createZodDto } from "nestjs-zod";
import {
  CreateProjectRequestSchema,
  ProjectSchema,
  ProjectTokenSchema,
  ProjectUploadSchema,
  UpdateProjectRequestSchema,
} from "@mooncellar/schemas";

export class ProjectDto extends createZodDto(ProjectSchema) {}

export class ProjectTokenDto extends createZodDto(ProjectTokenSchema) {}

export class ProjectUploadDto extends createZodDto(ProjectUploadSchema) {}

export class CreateProjectRequestDto extends createZodDto(
  CreateProjectRequestSchema
) {}

export class UpdateProjectRequestDto extends createZodDto(
  UpdateProjectRequestSchema
) {}
