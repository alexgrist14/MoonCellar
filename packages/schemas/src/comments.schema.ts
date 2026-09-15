import { z } from "zod";
import { categoriesZod, PlaythroughSchema } from "./playthroughs.schema";

export const COMMENT_MAX_LENGTH = 10000;
export const COMMENT_TEXT_LIMIT = 2000;
export const COMMENTS_PAGE_SIZE = 10;
export const REVIEWS_PAGE_SIZE = 10;

export const CommentStatusSchema = z.enum(["visible", "hidden", "deleted"]);
export const CommentsSortSchema = z.enum(["top", "new"]);
export const ReviewsSortSchema = z.enum(["helpful", "new"]);
export const ReviewCategorySchema = categoriesZod.exclude(["wishlist"]);

export const CommunityAuthorSchema = z.object({
  _id: z.string().describe("User id"),
  userName: z.string().describe("User name"),
  avatar: z.string().optional().describe("Avatar url"),
});

export const AuthorPlaythroughSchema = PlaythroughSchema.pick({
  category: true,
  time: true,
  isMastered: true,
});

export const CommentSchema = z.object({
  _id: z.string().describe("Comment id"),
  gameId: z.string().describe("Game id"),
  userId: z.string().describe("Author id"),
  parentId: z
    .string()
    .nullable()
    .describe("Top-level comment this one replies to"),
  replyToId: z
    .string()
    .nullable()
    .describe("Comment this one answers directly"),
  reviewId: z
    .string()
    .nullable()
    .describe("Review (public playthrough) the thread is about"),
  body: z
    .string()
    .describe("Sanitized rich text, empty when hidden from the viewer"),
  isSpoiler: z.boolean().describe("Comment contains spoilers"),
  likesCount: z.number().describe("Likes"),
  repliesCount: z.number().describe("Visible replies"),
  reportsCount: z.number().optional().describe("Reports, admins only"),
  status: CommentStatusSchema.describe("Moderation status"),
  createdAt: z.string().describe("Creation date"),
  updatedAt: z.string().describe("Last update date"),
});

export const CommentReplyTargetSchema = z.object({
  _id: z.string().describe("Comment id"),
  author: CommunityAuthorSchema.nullable().describe(
    "Author, null if the comment is no longer readable"
  ),
});

export const CommentReviewSchema = z.object({
  _id: z.string().describe("Review (playthrough) id"),
  author: CommunityAuthorSchema.nullable(),
  category: categoriesZod.describe("Review status"),
  rating: z.number().nullable().describe("Author's 1-10 rating"),
  excerpt: z.string().describe("Plain-text start of the review"),
});

export const CommentResponseSchema = CommentSchema.extend({
  replyTo: CommentReplyTargetSchema.nullable().describe(
    "Comment this one answers"
  ),
  review: CommentReviewSchema.nullable().describe(
    "Review the thread is about, null if it is no longer public"
  ),
  author: CommunityAuthorSchema.nullable().describe("Author, null if deleted"),
  authorPlaythrough: AuthorPlaythroughSchema.nullable().describe(
    "Author's latest playthrough of the game"
  ),
  isLiked: z.boolean().describe("Liked by the viewer"),
  isReported: z.boolean().describe("Reported by the viewer"),
});

export const CommentsResponseSchema = z.object({
  results: CommentResponseSchema.array(),
  total: z.number(),
});

export const GetCommentsRequestSchema = z.object({
  sort: CommentsSortSchema.default("top").describe("Sort order"),
  page: z.coerce.number().int().min(1).default(1).describe("Page"),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(COMMENTS_PAGE_SIZE)
    .describe("Page size"),
});

export const GetRepliesRequestSchema = GetCommentsRequestSchema.omit({
  sort: true,
});

export const CreateCommentRequestSchema = z.object({
  gameId: z.string().nonempty().describe("Game id"),
  parentId: z.string().optional().describe("Comment to reply to"),
  reviewId: z.string().optional().describe("Review to discuss"),
  body: z.string().nonempty().max(COMMENT_MAX_LENGTH).describe("Rich text"),
  isSpoiler: z.boolean().default(false).describe("Contains spoilers"),
});

export const UpdateCommentRequestSchema = CreateCommentRequestSchema.pick({
  body: true,
  isSpoiler: true,
});

export const UpdateCommentStatusRequestSchema = z.object({
  status: CommentStatusSchema.exclude(["deleted"]).describe("New status"),
});

export const VoteResponseSchema = z.object({
  count: z.number().describe("Votes after the change"),
  isActive: z.boolean().describe("Whether the viewer's vote is set"),
});

export const ReportResponseSchema = z.object({
  isReported: z.boolean(),
});

export const ReviewSchema = PlaythroughSchema.pick({
  _id: true,
  gameId: true,
  userId: true,
  platformId: true,
  category: true,
  date: true,
  time: true,
  comment: true,
  isMastered: true,
  updatedAt: true,
}).extend({
  isSpoiler: z.boolean().describe("Review contains spoilers"),
  helpfulCount: z.number().describe("Players who found it helpful"),
  platformName: z.string().nullable().describe("Platform name"),
  rating: z.number().nullable().describe("Author's 1-10 rating"),
  author: CommunityAuthorSchema.nullable(),
  isHelpful: z.boolean().describe("Marked helpful by the viewer"),
});

export const ReviewsSummarySchema = z.object({
  total: z.number().describe("All public reviews of the game"),
  ratedCount: z.number().describe("Reviewers who rated the game"),
  averageRating: z.number().nullable().describe("Average of those ratings"),
  categories: z
    .object({ category: ReviewCategorySchema, count: z.number() })
    .array()
    .describe("Reviews per status"),
});

export const ReviewsResponseSchema = z.object({
  results: ReviewSchema.array(),
  total: z.number().describe("Reviews matching the filter"),
  summary: ReviewsSummarySchema,
});

export const GetReviewsRequestSchema = z.object({
  category: ReviewCategorySchema.optional().describe("Filter by status"),
  sort: ReviewsSortSchema.default("helpful").describe("Sort order"),
  page: z.coerce.number().int().min(1).default(1).describe("Page"),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(REVIEWS_PAGE_SIZE)
    .describe("Page size"),
});

export type ICommentStatus = z.infer<typeof CommentStatusSchema>;
export type ICommentsSort = z.infer<typeof CommentsSortSchema>;
export type IReviewsSort = z.infer<typeof ReviewsSortSchema>;
export type IReviewCategory = z.infer<typeof ReviewCategorySchema>;
export type ICommunityAuthor = z.infer<typeof CommunityAuthorSchema>;
export type IComment = z.infer<typeof CommentResponseSchema>;
export type ICommentReview = z.infer<typeof CommentReviewSchema>;
export type ICommentReplyTarget = z.infer<typeof CommentReplyTargetSchema>;
export type ICommentsResponse = z.infer<typeof CommentsResponseSchema>;
export type IGetCommentsRequest = z.input<typeof GetCommentsRequestSchema>;
export type IGetCommentsParams = z.infer<typeof GetCommentsRequestSchema>;
export type IGetRepliesRequest = z.input<typeof GetRepliesRequestSchema>;
export type IGetRepliesParams = z.infer<typeof GetRepliesRequestSchema>;
export type ICreateCommentRequest = z.input<typeof CreateCommentRequestSchema>;
export type ICreateCommentParams = z.infer<typeof CreateCommentRequestSchema>;
export type IUpdateCommentRequest = z.input<typeof UpdateCommentRequestSchema>;
export type IUpdateCommentParams = z.infer<typeof UpdateCommentRequestSchema>;
export type IUpdateCommentStatusRequest = z.infer<
  typeof UpdateCommentStatusRequestSchema
>;
export type IVoteResponse = z.infer<typeof VoteResponseSchema>;
export type IReportResponse = z.infer<typeof ReportResponseSchema>;
export type IReview = z.infer<typeof ReviewSchema>;
export type IReviewsSummary = z.infer<typeof ReviewsSummarySchema>;
export type IReviewsResponse = z.infer<typeof ReviewsResponseSchema>;
export type IGetReviewsRequest = z.input<typeof GetReviewsRequestSchema>;
export type IGetReviewsParams = z.infer<typeof GetReviewsRequestSchema>;
