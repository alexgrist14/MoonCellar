import { z } from "zod";
import { categoriesZod } from "./playthroughs.schema";

export const LogPlaythroughActionSchema = z.enum([
  "added",
  "updated",
  "removed",
]);

export const LogPlaythroughStateSchema = z.object({
  category: categoriesZod.optional().describe("Playthrough status"),
  isMastered: z.boolean().optional(),
  platformId: z.string().optional(),
  platform: z.string().optional().describe("Platform name at the time"),
  date: z.string().optional().describe("Finish date, yyyy-mm-dd"),
  time: z.number().optional().describe("Spent time (hours)"),
  hasReview: z
    .boolean()
    .optional()
    .describe("The note is public, so it shows as a review"),
});

export const LogPlaythroughSchema = z.object({
  playthroughId: z.string().optional(),
  action: LogPlaythroughActionSchema,
  before: LogPlaythroughStateSchema.optional().describe(
    "State before the first change of the log, or the removed state"
  ),
  after: LogPlaythroughStateSchema.optional().describe(
    "State after the last change of the log"
  ),
});

export const LogRatingSchema = z.object({
  value: z
    .number()
    .nullable()
    .describe("Rating after the action, null when removed"),
  previous: z
    .number()
    .nullable()
    .optional()
    .describe("Rating before the first change of the log, null when unrated"),
});

export const LogChangesSchema = z.object({
  playthrough: LogPlaythroughSchema.optional(),
  rating: LogRatingSchema.optional(),
  favorite: z
    .boolean()
    .optional()
    .describe("true when added to favourites, false when removed from them"),
});

export const UserLogsSchemaZod = LogChangesSchema.extend({
  _id: z.string(),
  date: z.date(),
  gameId: z.string(),
  userId: z.string(),
});

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
export type ILogChanges = z.infer<typeof LogChangesSchema>;
export type ILogPlaythrough = z.infer<typeof LogPlaythroughSchema>;
export type ILogPlaythroughAction = z.infer<typeof LogPlaythroughActionSchema>;
export type ILogPlaythroughState = z.infer<typeof LogPlaythroughStateSchema>;
export type ILogRating = z.infer<typeof LogRatingSchema>;
