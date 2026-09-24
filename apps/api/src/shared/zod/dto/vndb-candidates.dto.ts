import { createZodDto } from "nestjs-zod";
import {
  DecideVndbCandidateRequestSchema,
  GetVndbCandidatesRequestSchema,
  VndbCandidatesResponseSchema,
  VndbCandidatesSummarySchema,
  VndbParseResponseSchema,
  VndbReviewItemResponseSchema,
} from "@mooncellar/schemas";

export class VndbReviewItemResponseDto extends createZodDto(
  VndbReviewItemResponseSchema
) {}

export class DecideVndbCandidateRequestDto extends createZodDto(
  DecideVndbCandidateRequestSchema
) {}

export class VndbCandidatesSummaryDto extends createZodDto(
  VndbCandidatesSummarySchema
) {}

export class GetVndbCandidatesRequestDto extends createZodDto(
  GetVndbCandidatesRequestSchema
) {}

export class VndbCandidatesResponseDto extends createZodDto(
  VndbCandidatesResponseSchema
) {}

export class VndbParseResponseDto extends createZodDto(
  VndbParseResponseSchema
) {}
