import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import {
  IScoreBreakdown,
  TDateSignal,
  TDescriptionSignal,
  TMatchReason,
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
  @Prop()
  reason: TMatchReason;
  @Prop({ type: [Object] })
  candidates: IVndbCandidateEntry[];
  @Prop()
  status: "resolved" | "pending" | "absent";
  @Prop({ type: Types.ObjectId, default: null })
  winner: Types.ObjectId | null;
}

export const VndbCandidateSchema = SchemaFactory.createForClass(VndbCandidate);
