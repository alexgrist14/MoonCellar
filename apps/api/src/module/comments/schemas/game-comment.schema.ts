import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { type ICommentStatus } from "@mooncellar/schemas";
import { Game } from "../../games/schemas/game.schema";
import { Playthrough } from "../../games/schemas/playthroughs.schema";
import { User } from "../../user/schemas/user.schema";

export type GameCommentDocument = HydratedDocument<GameComment>;

@Schema({ timestamps: true })
export class GameComment {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Game.name,
    required: true,
  })
  gameId: mongoose.Types.ObjectId;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  parentId: mongoose.Types.ObjectId | null;
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  replyToId: mongoose.Types.ObjectId | null;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Playthrough.name,
    default: null,
  })
  reviewId: mongoose.Types.ObjectId | null;
  @Prop({ type: String, default: "" })
  body: string;
  @Prop({ type: Boolean, default: false })
  isSpoiler: boolean;
  @Prop({ type: Number, default: 0 })
  likesCount: number;
  @Prop({ type: Number, default: 0 })
  repliesCount: number;
  @Prop({ type: Number, default: 0 })
  reportsCount: number;
  @Prop({ type: String, default: "visible" })
  status: ICommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const GameCommentDatabaseSchema =
  SchemaFactory.createForClass(GameComment);

GameCommentDatabaseSchema.index({ gameId: 1, parentId: 1, createdAt: -1 });
GameCommentDatabaseSchema.index({
  gameId: 1,
  parentId: 1,
  likesCount: -1,
  createdAt: -1,
});
GameCommentDatabaseSchema.index({ parentId: 1, createdAt: 1 });
GameCommentDatabaseSchema.index({ userId: 1, createdAt: -1 });
