import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { User } from "../../user/schemas/user.schema";
import { GameComment } from "./game-comment.schema";

export type CommentReportDocument = HydratedDocument<CommentReport>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CommentReport {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: GameComment.name,
    required: true,
  })
  commentId: mongoose.Types.ObjectId;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: mongoose.Types.ObjectId;
}

export const CommentReportDatabaseSchema =
  SchemaFactory.createForClass(CommentReport);

CommentReportDatabaseSchema.index({ commentId: 1, userId: 1 }, { unique: true });
