import { IVndbCandidateState, IVndbMatchReason } from "@mooncellar/schemas";

export const REASON_LABELS: Record<IVndbMatchReason, string> = {
  "below-threshold": "No candidate scored high enough",
  "competing-candidates": "Candidates scored too close to call",
  "weak-title": "The titles only loosely match",
  "date-contradicts": "Release dates contradict each other",
  "description-mismatch": "The descriptions do not match",
  "no-company-evidence": "No shared developer or publisher",
  "company-mismatch": "Developers and publishers differ",
  "unverified-title": "Only the title matches",
};

export const STATE_LABELS: Record<IVndbCandidateState, string> = {
  waiting: "Waiting",
  "queued-match": "Match queued",
  "queued-new": "New game queued",
  matched: "Matched",
  "new-game": "New game",
};
