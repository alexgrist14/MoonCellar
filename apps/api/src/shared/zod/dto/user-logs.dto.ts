import { createZodDto } from "nestjs-zod";
import {
  GetUserLogsSchema,
  RemoveUserLogSchema,
} from "../schemas/user-logs.schema";

export class GetUserLogsDto extends createZodDto(GetUserLogsSchema) {}
export class RemoveUserLogDto extends createZodDto(RemoveUserLogSchema) {}
