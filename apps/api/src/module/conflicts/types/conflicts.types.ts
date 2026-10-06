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
  externalData?: Record<string, unknown>;
}

export interface IConflictDecision {
  externalId: string;
  externalName: string;
  externalData: Record<string, unknown> | null;
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
  describe(
    externalId: string,
    externalData: Record<string, unknown> | null
  ): Promise<IConflictSubject | null>;
  apply(
    decisions: IConflictDecision[]
  ): Promise<Map<string, Types.ObjectId | null>>;
  rematch?(
    externalId: string,
    externalData: Record<string, unknown> | null
  ): Promise<IConflictRecord["candidates"] | null>;
}
