import { createZodDto } from "nestjs-zod";
import {
  AddConflictCandidateRequestSchema,
  ConflictItemResponseSchema,
  ConflictsResponseSchema,
  ConflictsSummaryRequestSchema,
  ConflictsSummarySchema,
  DecideConflictRequestSchema,
  GetConflictsRequestSchema,
} from "@mooncellar/schemas";

export class ConflictItemResponseDto extends createZodDto(
  ConflictItemResponseSchema
) {}

export class DecideConflictRequestDto extends createZodDto(
  DecideConflictRequestSchema
) {}

export class AddConflictCandidateRequestDto extends createZodDto(
  AddConflictCandidateRequestSchema
) {}

export class ConflictsSummaryRequestDto extends createZodDto(
  ConflictsSummaryRequestSchema
) {}

export class ConflictsSummaryDto extends createZodDto(ConflictsSummarySchema) {}

export class GetConflictsRequestDto extends createZodDto(
  GetConflictsRequestSchema
) {}

export class ConflictsResponseDto extends createZodDto(
  ConflictsResponseSchema
) {}
