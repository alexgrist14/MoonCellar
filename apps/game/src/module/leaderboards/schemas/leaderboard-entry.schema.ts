import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type LeaderboardEntryDocument = HydratedDocument<LeaderboardEntry>;

@Schema({ collection: "leaderboard_entries", timestamps: true })
export class LeaderboardEntry {
  @Prop({ type: String, required: true })
  game: string;
  @Prop({ type: String, required: true })
  board: string;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  displayName: string;
  @Prop({ type: Number, required: true })
  score: number;
  @Prop({ type: Buffer, default: null, select: false })
  replay: Buffer | null;
  @Prop({ type: Boolean, default: false })
  hasReplay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LeaderboardEntrySchema =
  SchemaFactory.createForClass(LeaderboardEntry);
LeaderboardEntrySchema.index(
  { game: 1, board: 1, userId: 1 },
  { unique: true }
);
LeaderboardEntrySchema.index({ game: 1, board: 1, score: 1, updatedAt: 1 });
