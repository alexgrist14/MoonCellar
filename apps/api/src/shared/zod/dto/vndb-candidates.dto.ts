import { createZodDto } from "nestjs-zod";
import {
  DecideVndbCandidateRequestSchema,
  GetNextVndbCandidateRequestSchema,
  NextVndbCandidateResponseSchema,
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
