import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { Game } from "../../games/schemas/game.schema";

export type GauntletHistoryDocument = HydratedDocument<GauntletHistory>;

@Schema()
export class GauntletHistory {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Game.name,
    required: true,
  })
  gameId: mongoose.Types.ObjectId;
  @Prop({ required: true })
  wonAt: Date;
}

export const GauntletHistoryDatabaseSchema =
  SchemaFactory.createForClass(GauntletHistory);

GauntletHistoryDatabaseSchema.index({ userId: 1, gameId: 1 }, { unique: true });
GauntletHistoryDatabaseSchema.index({ userId: 1, wonAt: -1 });
