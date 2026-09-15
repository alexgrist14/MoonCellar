import { z } from "zod";
import { CommentStatusSchema, CommunityAuthorSchema } from "./comments.schema";

export const COMMENT_REPORTS_PAGE_SIZE = 20;

export const CommentReportStatusSchema = z.enum(["open", "resolved"]);
export const CommentReportResolutionSchema = z.enum([
  "hidden",
  "deleted",
  "dismissed",
]);
export const CommentReportActionSchema = z.enum(["hide", "delete", "dismiss"]);

export const GetCommentReportsRequestSchema = z.object({
  status: CommentReportStatusSchema.default("open").describe(
    "Open reports waiting for a decision, or resolved ones"
  ),
  page: z.coerce.number().int().min(1).default(1).describe("Page"),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(COMMENT_REPORTS_PAGE_SIZE)
    .describe("Page size"),
});

export const ReportedCommentGameSchema = z.object({
  _id: z.string().describe("Game id"),
  name: z.string().describe("Game name"),
  slug: z.string().describe("Game slug"),
});

export const ReportedCommentSchema = z.object({
  status: CommentStatusSchema.describe("Current moderation status"),
  body: z
    .string()
    .describe("Sanitized rich text as stored, empty once deleted"),
  isSpoiler: z.boolean().describe("Comment contains spoilers"),
  createdAt: z.string().describe("Creation date"),
  updatedAt: z.string().describe("Last update date"),
  isReply: z.boolean().describe("The comment is a reply in a thread"),
  isOnReview: z.boolean().describe("The comment discusses a review"),
  author: CommunityAuthorSchema.nullable().describe("Author"),
  game: ReportedCommentGameSchema.nullable().describe("Game of the discussion"),
});

export const CommentReportGroupSchema = z.object({
  commentId: z.string().describe("Reported comment"),
  comment: ReportedCommentSchema.nullable().describe(
    "The comment, null if it no longer exists"
  ),
  reportsCount: z.number().describe("Reports in this group"),
  firstReportedAt: z.string().describe("Oldest report of the group"),
  lastReportedAt: z.string().describe("Newest report of the group"),
  reporters: CommunityAuthorSchema.array().describe(
    "Up to five most recent reporters, newest first"
  ),
  resolution: CommentReportResolutionSchema.nullable().describe(
    "Decision, null while open"
  ),
  resolvedAt: z.string().nullable().describe("When the decision was made"),
  resolvedBy: CommunityAuthorSchema.nullable().describe(
    "Who made the decision"
  ),
});

export const CommentReportsResponseSchema = z.object({
  results: CommentReportGroupSchema.array(),
  total: z.number().describe("Groups matching the status"),
});

export const ResolveCommentReportsRequestSchema = z.object({
  action: CommentReportActionSchema.describe(
    "Hide or delete the comment, or dismiss the reports and keep it"
  ),
});

export const ResolveCommentReportsResponseSchema = z.object({
  status: CommentStatusSchema.describe("Comment status after the decision"),
});

export type ICommentReportStatus = z.infer<typeof CommentReportStatusSchema>;
export type ICommentReportResolution = z.infer<
  typeof CommentReportResolutionSchema
>;
export type ICommentReportAction = z.infer<typeof CommentReportActionSchema>;
export type IGetCommentReportsRequest = z.input<
  typeof GetCommentReportsRequestSchema
>;
export type IGetCommentReportsParams = z.infer<
  typeof GetCommentReportsRequestSchema
>;
export type IReportedComment = z.infer<typeof ReportedCommentSchema>;
export type ICommentReportGroup = z.infer<typeof CommentReportGroupSchema>;
export type ICommentReportsResponse = z.infer<
  typeof CommentReportsResponseSchema
>;
export type IResolveCommentReportsRequest = z.infer<
  typeof ResolveCommentReportsRequestSchema
>;
export type IResolveCommentReportsResponse = z.infer<
  typeof ResolveCommentReportsResponseSchema
>;
