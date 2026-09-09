import { createZodDto } from "nestjs-zod";
import { GetUserLogsSchema, RemoveUserLogSchema } from "@mooncellar/schemas";

export class GetUserLogsDto extends createZodDto(GetUserLogsSchema) {}
export class RemoveUserLogDto extends createZodDto(RemoveUserLogSchema) {}
