import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type {
  IConflictEntry,
  IConflictSource,
  IDateSignal,
  IDescriptionSignal,
  IMatchReason,
  IScoreBreakdown,
} from "@mooncellar/schemas";

export interface IConflictCandidateEntry {
  gameId: Types.ObjectId;
  slug: string;
  name: string;
  score: number;
  breakdown: IScoreBreakdown;
  dateSignal: IDateSignal;
  descriptionSignal: IDescriptionSignal;
  hasCompanyMismatch: boolean;
  matchedTitle?: string | null;
  isManual?: boolean;
}

@Schema({ timestamps: true })
export class Conflict {
  @Prop({ type: String, required: true })
  source: IConflictSource;
  @Prop({ required: true })
  externalId: string;
  @Prop()
  externalName: string;
  @Prop({ type: String })
  reason: IMatchReason;
  @Prop({ type: [Object] })
  candidates: IConflictCandidateEntry[];
  @Prop({ type: [Object], default: [] })
  entries: IConflictEntry[];
  @Prop({ type: String, default: null })
  winnerEntryId: string | null;
  @Prop({ type: String })
  status: "resolved" | "pending" | "absent";
  @Prop({ type: Types.ObjectId, default: null })
  winner: Types.ObjectId | null;
  @Prop({ type: [Types.ObjectId], default: [] })
  winners: Types.ObjectId[];
  @Prop({ type: String, default: null })
  decision: "match" | "skip" | null;
  @Prop({ type: Object, default: null })
  decidedBy: { userId: Types.ObjectId; userName: string } | null;
}

export type ConflictDocument = Conflict & { _id: Types.ObjectId };

export const ConflictSchema = SchemaFactory.createForClass(Conflict);

ConflictSchema.index({ source: 1, externalId: 1 }, { unique: true });
ConflictSchema.index({ source: 1, status: 1, decision: 1 });
