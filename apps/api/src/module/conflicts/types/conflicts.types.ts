import type { Types } from "mongoose";
import type {
  IConflictDirection,
  IConflictEntry,
  IConflictSource,
  IConflictSubject,
  IMatchReason,
} from "@mooncellar/schemas";
import type { IScoredCandidate } from "../../games/matching/game-matcher.types";

export interface IConflictRecord {
  externalId: string;
  externalName: string;
  reason: IMatchReason | null;
  candidates: IScoredCandidate[];
  entries?: IConflictEntry[];
}

export interface IConflictDecision {
  externalId: string;
  externalName: string;
  decision: "match" | "skip";
  winner: Types.ObjectId | null;
  winnerEntryId: string | null;
}

export interface IConflictSourceHandler {
  source: IConflictSource;
  direction: IConflictDirection;
  linkField: string;
  describe(externalId: string): Promise<IConflictSubject | null>;
  apply(
    decisions: IConflictDecision[]
  ): Promise<Map<string, Types.ObjectId | null>>;
}
