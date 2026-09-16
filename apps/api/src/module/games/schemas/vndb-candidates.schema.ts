import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import {
  type IScoreBreakdown,
  type TDateSignal,
  type TDescriptionSignal,
  type TMatchReason,
} from "../interface/vndb.interface";

export interface IVndbCandidateEntry {
  gameId: Types.ObjectId;
  slug: string;
  name: string;
  score: number;
  breakdown: IScoreBreakdown;
  dateSignal: TDateSignal;
  descriptionSignal: TDescriptionSignal;
  hasCompanyMismatch: boolean;
}

@Schema({ timestamps: true })
export class VndbCandidate {
  @Prop({ unique: true, required: true })
  vnId: string;
  @Prop()
  vnName: string;
  @Prop({ type: String })
  reason: TMatchReason;
  @Prop({ type: [Object] })
  candidates: IVndbCandidateEntry[];
  @Prop({ type: String })
  status: "resolved" | "pending" | "absent";
  @Prop({ type: Types.ObjectId, default: null })
  winner: Types.ObjectId | null;
  @Prop({ type: String, default: null })
  decision: "match" | "skip" | null;
  @Prop({ type: Object, default: null })
  decidedBy: { userId: Types.ObjectId; userName: string } | null;
}

export const VndbCandidateSchema = SchemaFactory.createForClass(VndbCandidate);
