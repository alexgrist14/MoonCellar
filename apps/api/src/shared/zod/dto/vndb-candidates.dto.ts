import { createZodDto } from "nestjs-zod";
import {
  DecideVndbCandidateRequestSchema,
  GetNextVndbCandidateRequestSchema,
  GetVndbCandidatesRequestSchema,
  NextVndbCandidateResponseSchema,
  VndbCandidatesResponseSchema,
  VndbCandidatesSummarySchema,
} from "@mooncellar/schemas";

export class GetNextVndbCandidateRequestDto extends createZodDto(
  GetNextVndbCandidateRequestSchema
) {}

export class NextVndbCandidateResponseDto extends createZodDto(
  NextVndbCandidateResponseSchema
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
