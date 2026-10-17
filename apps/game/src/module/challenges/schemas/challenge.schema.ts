import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type ChallengeDocument = HydratedDocument<Challenge>;

@Schema({ collection: "challenges", timestamps: true })
export class Challenge {
  @Prop({ type: String, required: true })
  fromUserId: string;
  @Prop({ type: String, required: true })
  fromName: string;
  @Prop({ type: String, required: true })
  toUserId: string;
  @Prop({ type: Number, required: true })
  level: number;
  @Prop({ type: Number, required: true })
  timeMs: number;
  @Prop({ type: String, default: "" })
  comment: string;
  @Prop({ type: Buffer, required: true, select: false })
  ghost: Buffer;
  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;
  @Prop({ type: Date, required: true })
  expiresAt: Date;
  createdAt: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
ChallengeSchema.index({ toUserId: 1, deliveredAt: 1, createdAt: 1 });
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
