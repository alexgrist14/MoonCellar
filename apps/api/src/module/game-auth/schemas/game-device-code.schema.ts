import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";

export type GameDeviceCodeDocument = HydratedDocument<GameDeviceCode>;

@Schema({ collection: "game_device_codes", timestamps: true })
export class GameDeviceCode {
  @Prop({ type: String, required: true, unique: true })
  deviceCodeHash: string;
  @Prop({ type: String, required: true, unique: true })
  userCode: string;
  @Prop({ type: String, required: true })
  deviceName: string;
  @Prop({ type: Date, required: true })
  expiresAt: Date;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
  approvedBy: mongoose.Types.ObjectId | null;
  @Prop({ type: Date, default: null })
  lastPolledAt: Date | null;
}

export const GameDeviceCodeSchema =
  SchemaFactory.createForClass(GameDeviceCode);
GameDeviceCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
