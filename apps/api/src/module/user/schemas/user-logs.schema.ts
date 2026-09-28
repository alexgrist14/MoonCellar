import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { Game } from "../../games/schemas/game.schema";
import type { ILogPlaythrough, ILogRating } from "@mooncellar/schemas";

export type UserLogsDocument = HydratedDocument<UserLogs>;

@Schema()
export class UserLogs {
  @Prop()
  date: Date;
  @Prop({ type: Object })
  playthrough?: ILogPlaythrough;
  @Prop({ type: Object })
  rating?: ILogRating;
  @Prop()
  favorite?: boolean;
  @Prop({ ref: Game.name })
  gameId: mongoose.Types.ObjectId;
  @Prop({ ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
