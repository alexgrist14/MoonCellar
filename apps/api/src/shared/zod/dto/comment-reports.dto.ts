import { createZodDto } from "nestjs-zod";
import {
  AdminCommentsResponseSchema,
  CommentReportsResponseSchema,
  GetAdminCommentsRequestSchema,
  GetCommentReportsRequestSchema,
  ResolveCommentReportsRequestSchema,
  ResolveCommentReportsResponseSchema,
} from "@mooncellar/schemas";

export class GetCommentReportsRequestDto extends createZodDto(
  GetCommentReportsRequestSchema
) {}

export class CommentReportsResponseDto extends createZodDto(
  CommentReportsResponseSchema
) {}

export class ResolveCommentReportsRequestDto extends createZodDto(
  ResolveCommentReportsRequestSchema
) {}

export class ResolveCommentReportsResponseDto extends createZodDto(
  ResolveCommentReportsResponseSchema
) {}

export class GetAdminCommentsRequestDto extends createZodDto(
  GetAdminCommentsRequestSchema
) {}

export class AdminCommentsResponseDto extends createZodDto(
  AdminCommentsResponseSchema
) {}
