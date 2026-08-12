import { z } from "zod";

const LogTypeSchema = z.enum(["list", "custom", "rating"]);

export const UserLogsSchemaZod = z.object({
  _id: z.string(),
  date: z.date(),
  type: LogTypeSchema,
  text: z.string(),
  gameId: z.string(),
  userId: z.string(),
});

export const UserLogSchema = UserLogsSchemaZod.omit({ _id: true, date: true });
export const GetUserLogsSchema = z.object({
  take: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
});
export const RemoveUserLogSchema = UserLogsSchemaZod.pick({
  _id: true,
  userId: true,
});

export type IGetUserLogsRequest = z.infer<typeof GetUserLogsSchema>;
export type IRemoveUserLogRequest = z.infer<typeof RemoveUserLogSchema>;
export type ILog = z.infer<typeof UserLogsSchemaZod>;
export type ILogType = z.infer<typeof LogTypeSchema>;
export type IUserLog = z.infer<typeof UserLogSchema>;
