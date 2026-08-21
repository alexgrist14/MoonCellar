import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class VndbCandidate {
  @Prop({ unique: true, required: true })
  vnId: string;
  @Prop()
  candidates: Types.ObjectId[];
  @Prop()
  status: "resolved" | "pending" | "absent";
  @Prop()
  winner: Types.ObjectId | null;
}

export const VndbCandidateSchema = SchemaFactory.createForClass(VndbCandidate);
