import { z } from "zod";
import { CompanySchema } from "./games.schema";
import { ObjectIdSchema } from "./utils";

export const VndbMatchReasonSchema = z.enum([
  "below-threshold",
  "competing-candidates",
  "weak-title",
  "date-contradicts",
  "description-mismatch",
  "no-company-evidence",
  "company-mismatch",
  "unverified-title",
]);

export const VndbDateSignalSchema = z.enum([
  "confirms",
  "contradicts",
  "unknown",
]);

export const VndbDescriptionSignalSchema = z.enum([
  "match",
  "mismatch",
  "unknown",
]);

export const VndbScoreBreakdownSchema = z.object({
  title: z.number(),
  companies: z.number(),
  date: z.number(),
  platforms: z.number(),
  genre: z.number(),
  type: z.number(),
});

export const VNDB_CANDIDATES_PAGE_SIZE = 20;

export const VndbCandidateStateSchema = z.enum([
  "waiting",
  "queued-match",
  "queued-new",
  "matched",
  "new-game",
]);

export const VndbReviewNovelSchema = z.object({
  name: z.string().describe("Name the game gets from VNDB"),
  originalName: z.string().describe("Title in the original language"),
  alternativeNames: z.string().array(),
  description: z.string().describe("VNDB description without BBCode"),
  released: z
    .string()
    .nullable()
    .describe("First release as yyyy, yyyy-mm or yyyy-mm-dd"),
  developers: z.string().array(),
  platformIds: z
    .string()
    .array()
    .describe("Catalogue platforms matching the VNDB platforms"),
  lengthMinutes: z.number().nullable(),
  cover: z.string().nullable(),
  isExplicitCover: z.boolean(),
});

export const VndbReviewGameSchema = z.object({
  cover: z.string().nullable(),
  type: z.string().nullable(),
  summary: z.string().nullable(),
  alternativeNames: z.string().array(),
  companies: CompanySchema.array(),
  firstRelease: z.number().nullable().describe("Unix seconds"),
  platformIds: z.string().array(),
  linkedVnId: z
    .string()
    .nullable()
    .describe("VN the game is already linked to"),
});

export const VndbReviewCandidateSchema = z.object({
  gameId: z.string(),
  slug: z.string(),
  name: z.string(),
  score: z.number(),
  breakdown: VndbScoreBreakdownSchema,
  dateSignal: VndbDateSignalSchema,
  descriptionSignal: VndbDescriptionSignalSchema,
  hasCompanyMismatch: z.boolean(),
  game: VndbReviewGameSchema.nullable().describe(
    "The game as stored now, null if it was deleted"
  ),
});

export const VndbReviewItemSchema = z.object({
  id: z.string().describe("Candidate record id"),
  vnId: z.string(),
  reason: VndbMatchReasonSchema.nullable(),
  state: VndbCandidateStateSchema.describe("Where the VN stands in the review"),
  remaining: z.number().describe("Undecided VNs from this one onwards"),
  nextVnId: z
    .string()
    .nullable()
    .describe("Next VN waiting for a decision after this one"),
  decidedBy: z
    .string()
    .nullable()
    .describe("Admin who recorded the decision"),
  vn: VndbReviewNovelSchema.nullable().describe(
    "Null if VNDB no longer has the VN"
  ),
  candidates: VndbReviewCandidateSchema.array(),
});

export const VndbCandidatesSummarySchema = z.object({
  pending: z.number().describe("VNs waiting for a decision"),
  applying: z.number().describe("Decisions not yet written to games"),
  firstVnId: z
    .string()
    .nullable()
    .describe("First VN waiting for a decision, where a review starts"),
});

export const GetVndbCandidatesRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe("Page"),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(VNDB_CANDIDATES_PAGE_SIZE)
    .describe("Page size"),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe("Match a VN title or a candidate game name"),
});

export const VndbCandidateGameSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  slug: z.string(),
  score: z.number(),
});

export const VndbCandidateRowSchema = z.object({
  vnId: z.string(),
  vnName: z.string(),
  reason: VndbMatchReasonSchema.nullable(),
  state: VndbCandidateStateSchema.describe("Where the VN stands in the review"),
  candidates: VndbCandidateGameSchema.array(),
  winner: z
    .object({ _id: z.string(), name: z.string(), slug: z.string() })
    .nullable()
    .describe("Game the VN ended up in"),
});

export const VndbCandidatesResponseSchema = z.object({
  results: VndbCandidateRowSchema.array(),
  total: z.number().describe("Rows matching the search"),
});

export const VndbReviewItemResponseSchema = z.object({
  item: VndbReviewItemSchema.nullable(),
});

export const DecideVndbCandidateRequestSchema = z.object({
  gameId: ObjectIdSchema.nullable().describe(
    "Candidate game to update from VNDB, or null to create a new game"
  ),
});

export type IVndbCandidateState = z.infer<typeof VndbCandidateStateSchema>;
export type IVndbCandidateRow = z.infer<typeof VndbCandidateRowSchema>;
export type IGetVndbCandidatesRequest = z.input<
  typeof GetVndbCandidatesRequestSchema
>;
export type IGetVndbCandidatesParams = z.infer<
  typeof GetVndbCandidatesRequestSchema
>;
export type IVndbCandidatesResponse = z.infer<
  typeof VndbCandidatesResponseSchema
>;
export type IVndbMatchReason = z.infer<typeof VndbMatchReasonSchema>;
export type IVndbDateSignal = z.infer<typeof VndbDateSignalSchema>;
export type IVndbDescriptionSignal = z.infer<
  typeof VndbDescriptionSignalSchema
>;
export type IVndbScoreBreakdown = z.infer<typeof VndbScoreBreakdownSchema>;
export type IVndbReviewNovel = z.infer<typeof VndbReviewNovelSchema>;
export type IVndbReviewGame = z.infer<typeof VndbReviewGameSchema>;
export type IVndbReviewCandidate = z.infer<typeof VndbReviewCandidateSchema>;
export type IVndbReviewItem = z.infer<typeof VndbReviewItemSchema>;
export type IVndbCandidatesSummary = z.infer<
  typeof VndbCandidatesSummarySchema
>;
export type IVndbReviewItemResponse = z.infer<
  typeof VndbReviewItemResponseSchema
>;
export type IDecideVndbCandidateRequest = z.infer<
  typeof DecideVndbCandidateRequestSchema
>;
