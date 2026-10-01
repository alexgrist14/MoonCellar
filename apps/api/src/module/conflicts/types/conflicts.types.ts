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
  candidates: (IScoredCandidate & { matchedTitle?: string | null })[];
  entries?: IConflictEntry[];
}

export interface IConflictDecision {
  externalId: string;
  externalName: string;
  decision: "match" | "skip";
  winner: Types.ObjectId | null;
  winners: Types.ObjectId[];
  winnerEntryId: string | null;
}

export interface IConflictSourceHandler {
  source: IConflictSource;
  direction: IConflictDirection;
  isMultiMatch?: boolean;
  linkField: string;
  describe(externalId: string): Promise<IConflictSubject | null>;
  apply(
    decisions: IConflictDecision[]
  ): Promise<Map<string, Types.ObjectId | null>>;
  rematch?(externalId: string): Promise<IConflictRecord["candidates"] | null>;
}
