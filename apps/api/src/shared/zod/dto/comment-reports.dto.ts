import { createZodDto } from "nestjs-zod";
import {
  CommentReportsResponseSchema,
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
