import { createZodDto } from "nestjs-zod";
import {
  CreateProjectRequestSchema,
  CreateProjectTokenRequestSchema,
  ProjectConnectCodeSchema,
  ProjectConnectRequestSchema,
  ProjectSchema,
  ProjectTokenExchangeRequestSchema,
  ProjectTokenExchangeSchema,
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

export class CreateProjectTokenRequestDto extends createZodDto(
  CreateProjectTokenRequestSchema
) {}

export class ProjectConnectRequestDto extends createZodDto(
  ProjectConnectRequestSchema
) {}

export class ProjectConnectCodeDto extends createZodDto(
  ProjectConnectCodeSchema
) {}

export class ProjectTokenExchangeRequestDto extends createZodDto(
  ProjectTokenExchangeRequestSchema
) {}

export class ProjectTokenExchangeDto extends createZodDto(
  ProjectTokenExchangeSchema
) {}
