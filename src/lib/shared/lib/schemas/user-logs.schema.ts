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

export type IGetUserLogsRequest = z.infer<typeof GetUserLogsSchema>;
export type ILog = z.infer<typeof UserLogsSchemaZod>;
export type ILogType = z.infer<typeof LogTypeSchema>;
export type IUserLog = z.infer<typeof UserLogSchema>;
