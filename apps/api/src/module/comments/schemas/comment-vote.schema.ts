import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";

export type ICommentVoteTarget = "comment" | "review";

export type CommentVoteDocument = HydratedDocument<CommentVote>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CommentVote {
  @Prop({ type: String, required: true })
  target: ICommentVoteTarget;
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  targetId: mongoose.Types.ObjectId;
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
}

export const CommentVoteDatabaseSchema =
  SchemaFactory.createForClass(CommentVote);

CommentVoteDatabaseSchema.index(
  { target: 1, targetId: 1, userId: 1 },
  { unique: true }
);
CommentVoteDatabaseSchema.index({ userId: 1, target: 1, targetId: 1 });
