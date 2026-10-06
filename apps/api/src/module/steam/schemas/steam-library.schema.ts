import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export interface ISteamLibraryEntry {
  appId: number;
  gameId: mongoose.Types.ObjectId;
  playtime: number;
}

@Schema({ collection: "steamlibraries", versionKey: false })
export class SteamLibrary {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, unique: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  games: ISteamLibraryEntry[];

  @Prop({ type: Date, required: true })
  syncedAt: Date;
}

export const SteamLibrarySchema = SchemaFactory.createForClass(SteamLibrary);
