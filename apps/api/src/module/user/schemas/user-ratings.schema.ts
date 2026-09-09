import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Game } from "src/module/games/schemas/game.schema";
import { User } from "./user.schema";

@Schema()
export class Rating {
  @Prop()
  rating: number;
  @Prop({ ref: Game.name })
  gameId: mongoose.Types.ObjectId;
  @Prop({ ref: User.name })
  userId: mongoose.Types.ObjectId;
}

export const UserRatingsDatabaseSchema = SchemaFactory.createForClass(Rating);
