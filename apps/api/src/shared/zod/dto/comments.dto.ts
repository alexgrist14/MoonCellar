import { createZodDto } from "nestjs-zod";
import {
  CommentResponseSchema,
  CommentsResponseSchema,
  CreateCommentRequestSchema,
  GetCommentsRequestSchema,
  GetRepliesRequestSchema,
  GetReviewsRequestSchema,
  GetUserReviewsRequestSchema,
  ReportResponseSchema,
  ReviewsResponseSchema,
  UpdateCommentRequestSchema,
  UpdateCommentStatusRequestSchema,
  UserReviewsResponseSchema,
  VoteResponseSchema,
} from "@mooncellar/schemas";

export class GetCommentsRequestDto extends createZodDto(
  GetCommentsRequestSchema
) {}

export class GetRepliesRequestDto extends createZodDto(
  GetRepliesRequestSchema
) {}

export class CreateCommentRequestDto extends createZodDto(
  CreateCommentRequestSchema
) {}

export class UpdateCommentRequestDto extends createZodDto(
  UpdateCommentRequestSchema
) {}

export class UpdateCommentStatusRequestDto extends createZodDto(
  UpdateCommentStatusRequestSchema
) {}

export class CommentResponseDto extends createZodDto(CommentResponseSchema) {}

export class CommentsResponseDto extends createZodDto(CommentsResponseSchema) {}

export class VoteResponseDto extends createZodDto(VoteResponseSchema) {}

export class ReportResponseDto extends createZodDto(ReportResponseSchema) {}

export class GetReviewsRequestDto extends createZodDto(
  GetReviewsRequestSchema
) {}

export class ReviewsResponseDto extends createZodDto(ReviewsResponseSchema) {}

export class GetUserReviewsRequestDto extends createZodDto(
  GetUserReviewsRequestSchema
) {}

export class UserReviewsResponseDto extends createZodDto(
  UserReviewsResponseSchema
) {}
