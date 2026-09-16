import { z } from "zod";
import { VndbCandidateStateSchema } from "./vndb-candidates.schema";

export const VNDB_REVIEW_SOCKET_NAMESPACE = "/vndb-review";

export enum VndbReviewSocketEvent {
  CANDIDATE_DECIDED = "candidate:decided",
  CANDIDATES_APPLIED = "candidates:applied",
}

export const VndbCandidateDecidedEventSchema = z.object({
  vnId: z.string(),
  state: VndbCandidateStateSchema.describe("State after the decision"),
  decidedBy: z.string().nullable().describe("Admin who decided"),
});

export const VndbCandidatesAppliedEventSchema = z.object({
  vnIds: z
    .string()
    .array()
    .describe(
      "VNs whose decisions were written to games or returned to review"
    ),
});

export type IVndbCandidateDecidedEvent = z.infer<
  typeof VndbCandidateDecidedEventSchema
>;
export type IVndbCandidatesAppliedEvent = z.infer<
  typeof VndbCandidatesAppliedEventSchema
>;

export type IVndbReviewClientEvents = Record<string, never>;

export type IVndbReviewServerEvents = {
  [VndbReviewSocketEvent.CANDIDATE_DECIDED]: (
    event: IVndbCandidateDecidedEvent
  ) => void;
  [VndbReviewSocketEvent.CANDIDATES_APPLIED]: (
    event: IVndbCandidatesAppliedEvent
  ) => void;
};
