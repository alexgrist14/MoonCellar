import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type AchievementStateDocument = HydratedDocument<AchievementState>;

// A player's state of one achievement: unlocked (once, with its time) and/or how far they are
@Schema({ collection: "achievement_states", timestamps: true })
export class AchievementState {
  @Prop({ type: String, required: true })
  game: string;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  key: string;
  // No defaults: an upsert sets them itself, and a default would clash with its operators
  @Prop({ type: Date })
  unlockedAt?: Date | null;
  @Prop({ type: Number })
  current?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const AchievementStateSchema =
  SchemaFactory.createForClass(AchievementState);
AchievementStateSchema.index({ game: 1, userId: 1, key: 1 }, { unique: true });
AchievementStateSchema.index({ userId: 1 });
