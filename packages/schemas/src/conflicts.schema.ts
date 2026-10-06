import { z } from "zod";
import { CompanySchema } from "./games.schema";
import { ObjectIdSchema } from "./utils";

export const ConflictSourceSchema = z.enum([
  "vndb",
  "igdb",
  "hltb",
  "ra",
  "steam",
]);

export const ConflictDirectionSchema = z
  .enum(["games", "entries"])
  .describe(
    "games: a source entry against catalogue games; entries: a catalogue game against source entries"
  );

export const MatchReasonSchema = z.enum([
  "below-threshold",
  "competing-candidates",
  "weak-title",
  "date-contradicts",
  "genre-mismatch",
  "description-mismatch",
  "no-company-evidence",
  "company-mismatch",
  "unverified-title",
  "custom-game",
]);

export const DateSignalSchema = z.enum(["confirms", "contradicts", "unknown"]);

export const DescriptionSignalSchema = z.enum(["match", "mismatch", "unknown"]);

export const ScoreBreakdownSchema = z.object({
  title: z.number(),
  companies: z.number(),
  date: z.number(),
  platforms: z.number(),
  genre: z.number(),
  type: z.number(),
});

export const CONFLICTS_PAGE_SIZE = 20;

export const ConflictStateSchema = z.enum([
  "waiting",
  "queued-match",
  "queued-new",
  "matched",
  "new-game",
]);

export const ConflictSubjectSchema = z.object({
  name: z.string().describe("Name the game gets from the source"),
  originalName: z.string().describe("Title in the original language"),
  alternativeNames: z.string().array(),
  description: z.string().describe("Description without markup"),
  released: z
    .string()
    .nullable()
    .describe("First release as yyyy, yyyy-mm or yyyy-mm-dd"),
  developers: z.string().array(),
  platformIds: z
    .string()
    .array()
    .describe("Catalogue platforms matching the source platforms"),
  lengthMinutes: z.number().nullable(),
  cover: z.string().nullable(),
  isExplicitCover: z.boolean(),
  url: z.string().nullable().describe("Page of the entry at the source"),
});

export const ConflictGameSchema = z.object({
  cover: z.string().nullable(),
  type: z.string().nullable(),
  summary: z.string().nullable(),
  alternativeNames: z.string().array(),
  companies: CompanySchema.array(),
  firstRelease: z.number().nullable().describe("Unix seconds"),
  platformIds: z.string().array(),
  isCustom: z.boolean().describe("Added by hand, not by a parser"),
  linkedExternalId: z
    .string()
    .nullable()
    .describe("Entry of the same source the game is already linked to"),
});

export const ConflictCandidateSchema = z.object({
  gameId: z.string(),
  slug: z.string(),
  name: z.string(),
  score: z.number(),
  breakdown: ScoreBreakdownSchema,
  dateSignal: DateSignalSchema,
  descriptionSignal: DescriptionSignalSchema,
  hasCompanyMismatch: z.boolean(),
  matchedTitle: z
    .string()
    .nullable()
    .describe(
      "Title of the source entry the candidate matched, when the entry has several"
    ),
  isManual: z
    .boolean()
    .describe("Added by an admin through search, not found by the matcher"),
  game: ConflictGameSchema.nullable().describe(
    "The game as stored now, null if it was deleted"
  ),
});

export const ConflictEntrySchema = z.object({
  id: z.string().describe("Entry id at the source"),
  name: z.string(),
  score: z.number().nullable(),
  releaseYear: z.number().nullable(),
  platforms: z.string().array(),
  cover: z.string().nullable(),
  url: z.string().nullable(),
  details: z.string().array().describe("Short facts shown on the card"),
});

export const ConflictItemSchema = z.object({
  id: z.string().describe("Conflict record id"),
  source: ConflictSourceSchema,
  direction: ConflictDirectionSchema,
  isMultiMatch: z
    .boolean()
    .describe("One entry may be linked to several candidate games at once"),
  externalId: z.string(),
  reason: MatchReasonSchema.nullable(),
  state: ConflictStateSchema.describe("Where the conflict stands"),
  remaining: z
    .number()
    .describe("Undecided conflicts of this source from this one onwards"),
  nextExternalId: z
    .string()
    .nullable()
    .describe("Next conflict of this source waiting for a decision"),
  decidedBy: z.string().nullable().describe("Admin who recorded the decision"),
  subject: ConflictSubjectSchema.nullable().describe(
    "Null if the source no longer has the entry"
  ),
  candidates: ConflictCandidateSchema.array(),
  entries: ConflictEntrySchema.array(),
});

export const ConflictsSummaryRequestSchema = z.object({
  source: ConflictSourceSchema.optional(),
});

export const ConflictsSummarySchema = z.object({
  pending: z.number().describe("Conflicts waiting for a decision"),
  applying: z.number().describe("Decisions not yet written to games"),
  firstExternalId: z
    .string()
    .nullable()
    .describe("First conflict waiting for a decision, where a review starts"),
  firstSource: ConflictSourceSchema.nullable(),
  bySource: z
    .record(ConflictSourceSchema, z.number())
    .describe("Conflicts waiting for a decision per source"),
});

export const GetConflictsRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe("Page"),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(CONFLICTS_PAGE_SIZE)
    .describe("Page size"),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe("Match an entry title or a candidate game name"),
  source: ConflictSourceSchema.optional(),
  state: ConflictStateSchema.optional().describe(
    "Only conflicts in this state"
  ),
});

export const ConflictCandidateGameSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  slug: z.string(),
  score: z.number(),
});

export const ConflictRowSchema = z.object({
  source: ConflictSourceSchema,
  direction: ConflictDirectionSchema,
  externalId: z.string(),
  externalName: z.string(),
  reason: MatchReasonSchema.nullable(),
  state: ConflictStateSchema.describe("Where the conflict stands"),
  candidates: ConflictCandidateGameSchema.array(),
  entries: z.object({ id: z.string(), name: z.string() }).array(),
  winners: z
    .object({ _id: z.string(), name: z.string(), slug: z.string() })
    .array()
    .describe("Games the entry ended up in"),
});

export const ConflictsResponseSchema = z.object({
  results: ConflictRowSchema.array(),
  total: z.number().describe("Rows matching the search"),
});

export const ConflictItemResponseSchema = z.object({
  item: ConflictItemSchema.nullable(),
});

export const DecideConflictRequestSchema = z.object({
  gameId: ObjectIdSchema.nullable()
    .optional()
    .describe(
      "games direction: candidate game the entry is the same as, or null to create a new game"
    ),
  gameIds: ObjectIdSchema.array()
    .min(1)
    .optional()
    .describe(
      "games direction, multi-match sources only: every candidate game the entry belongs to"
    ),
  entryId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "entries direction: source entry the game is, or null to leave the game unmatched"
    ),
});

export const AddConflictCandidateRequestSchema = z.object({
  gameId: ObjectIdSchema.describe(
    "Catalogue game to add to the candidates of a waiting games-direction conflict"
  ),
});

export const POSSIBLE_DUPLICATES_MESSAGE =
  "This game may already exist in the catalogue";

export const PossibleDuplicateSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  score: z.number(),
});

export const PossibleDuplicatesErrorSchema = z.object({
  message: z.literal(POSSIBLE_DUPLICATES_MESSAGE),
  duplicates: PossibleDuplicateSchema.array(),
});

export const GameConflictSchema = z.object({
  source: ConflictSourceSchema,
  externalId: z.string(),
  externalName: z.string(),
});

export const GameConflictsResponseSchema = GameConflictSchema.array();

export const PossibleDuplicatesResponseSchema = z.object({
  duplicates: PossibleDuplicateSchema.array(),
});

export type IPossibleDuplicate = z.infer<typeof PossibleDuplicateSchema>;
export type IPossibleDuplicatesError = z.infer<
  typeof PossibleDuplicatesErrorSchema
>;
export type IConflictSource = z.infer<typeof ConflictSourceSchema>;
export type IGameConflict = z.infer<typeof GameConflictSchema>;
export type IConflictState = z.infer<typeof ConflictStateSchema>;
export type IConflictDirection = z.infer<typeof ConflictDirectionSchema>;
export type IConflictEntry = z.infer<typeof ConflictEntrySchema>;
export type IConflictRow = z.infer<typeof ConflictRowSchema>;
export type IGetConflictsRequest = z.input<typeof GetConflictsRequestSchema>;
export type IGetConflictsParams = z.infer<typeof GetConflictsRequestSchema>;
export type IConflictsResponse = z.infer<typeof ConflictsResponseSchema>;
export type IMatchReason = z.infer<typeof MatchReasonSchema>;
export type IDateSignal = z.infer<typeof DateSignalSchema>;
export type IDescriptionSignal = z.infer<typeof DescriptionSignalSchema>;
export type IScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type IConflictSubject = z.infer<typeof ConflictSubjectSchema>;
export type IConflictGame = z.infer<typeof ConflictGameSchema>;
export type IConflictCandidate = z.infer<typeof ConflictCandidateSchema>;
export type IConflictItem = z.infer<typeof ConflictItemSchema>;
export type IAddConflictCandidateRequest = z.infer<
  typeof AddConflictCandidateRequestSchema
>;
export type IConflictsSummaryRequest = z.infer<
  typeof ConflictsSummaryRequestSchema
>;
export type IConflictsSummary = z.infer<typeof ConflictsSummarySchema>;
export type IConflictItemResponse = z.infer<typeof ConflictItemResponseSchema>;
export type IDecideConflictRequest = z.infer<
  typeof DecideConflictRequestSchema
>;
