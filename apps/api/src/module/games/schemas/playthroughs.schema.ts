import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";
import { CategoriesType } from "src/module/user/types/actions";
import { Platform } from "./platform.schema";
import { Game } from "./game.schema";

export type IPlaythroughDocument = HydratedDocument<Playthrough>;

@Schema()
export class Playthrough {
  @Prop({ ref: User.name })
  userId: mongoose.Schema.Types.ObjectId;
  @Prop({ type: String })
  category: CategoriesType;
  @Prop()
  date: string;
  @Prop()
  time: number;
  @Prop()
  comment: string;
  @Prop({ ref: Game.name })
  gameId: mongoose.Schema.Types.ObjectId;
  @Prop({ ref: Platform.name })
  platformId: mongoose.Schema.Types.ObjectId;
  @Prop()
  isMastered: boolean;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const PlaythroughDatabaseSchema =
  SchemaFactory.createForClass(Playthrough);

PlaythroughDatabaseSchema.index({ gameId: 1, userId: 1 });
