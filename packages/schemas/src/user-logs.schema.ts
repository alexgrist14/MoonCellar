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

export const LogSegmentKindSchema = z.enum([
  "added",
  "updated",
  "removed",
  "rating",
  "favorite",
  "legacy",
]);

export const LogSegmentSchema = z.object({
  kind: LogSegmentKindSchema,
  title: z.string().describe("Plain-text header of the segment"),
  status: z.string().optional().describe("Playthrough status"),
  console: z.string().optional().describe("Platform name"),
  date: z.string().optional().describe("Finish date, dd.mm.yyyy"),
  time: z.string().optional().describe("Hours, as stored"),
  rating: z.number().optional().describe("Rating set by the action"),
  isRemoval: z.boolean().optional().describe("The action removed something"),
  html: z.string().describe("Rendered HTML of this segment"),
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
export type ILogSegmentKind = z.infer<typeof LogSegmentKindSchema>;
export type ILogSegment = z.infer<typeof LogSegmentSchema>;
export type IUserLog = z.infer<typeof UserLogSchema>;
