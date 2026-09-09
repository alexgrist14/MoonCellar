import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Game } from "src/module/games/schemas/game.schema";
import { ILogType } from "src/shared/zod/schemas/user-logs.schema";

export type UserLogsDocument = HydratedDocument<UserLogs>;

@Schema()
export class UserLogs {
  @Prop()
  date: Date;
  @Prop({ type: String })
  type: ILogType;
  @Prop()
  text: string;
  @Prop({ ref: Game.name })
  gameId: mongoose.Types.ObjectId;
  @Prop({ ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
