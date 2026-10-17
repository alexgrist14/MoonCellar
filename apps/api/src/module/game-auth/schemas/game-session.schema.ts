import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";

export type GameSessionDocument = HydratedDocument<GameSession>;

@Schema({ collection: "game_sessions", timestamps: true })
export class GameSession {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  deviceName: string;
  @Prop({ type: Date, required: true })
  lastUsedAt: Date;
  @Prop({ type: Date, default: null })
  revokedAt: Date | null;
  createdAt: Date;
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);
GameSessionSchema.index({ userId: 1, revokedAt: 1 });
