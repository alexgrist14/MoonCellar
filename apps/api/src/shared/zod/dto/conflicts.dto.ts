import { createZodDto } from "nestjs-zod";
import {
  AddConflictCandidateRequestSchema,
  ConflictItemResponseSchema,
  ConflictsAiStatusSchema,
  ConflictAiMatchesResponseSchema,
  UndoAiMatchesRequestSchema,
  ConflictsResponseSchema,
  ConflictsSummaryRequestSchema,
  ConflictsSummarySchema,
  DecideConflictRequestSchema,
  GameConflictsResponseSchema,
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

export class GameConflictsResponseDto extends createZodDto(
  GameConflictsResponseSchema
) {}

export class ConflictsAiStatusDto extends createZodDto(
  ConflictsAiStatusSchema
) {}

export class ConflictAiMatchesResponseDto extends createZodDto(
  ConflictAiMatchesResponseSchema
) {}

export class UndoAiMatchesRequestDto extends createZodDto(
  UndoAiMatchesRequestSchema
) {}
