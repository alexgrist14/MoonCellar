import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type LeaderboardEntryDocument = HydratedDocument<LeaderboardEntry>;

@Schema({ collection: "leaderboard_entries", timestamps: true })
export class LeaderboardEntry {
  @Prop({ type: Number, required: true })
  level: number;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  displayName: string;
  @Prop({ type: Number, required: true })
  timeMs: number;
  @Prop({ type: Buffer, default: null, select: false })
  ghost: Buffer | null;
  @Prop({ type: Boolean, default: false })
  hasGhost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LeaderboardEntrySchema =
  SchemaFactory.createForClass(LeaderboardEntry);
LeaderboardEntrySchema.index({ level: 1, userId: 1 }, { unique: true });
LeaderboardEntrySchema.index({ level: 1, timeMs: 1, updatedAt: 1 });
