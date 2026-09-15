import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import {
  type ICommentReportResolution,
  type ICommentReportStatus,
} from "@mooncellar/schemas";
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
  @Prop({ type: String, default: "open" })
  status: ICommentReportStatus;
  @Prop({ type: String, default: null })
  resolution: ICommentReportResolution | null;
  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  resolvedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

export const CommentReportDatabaseSchema =
  SchemaFactory.createForClass(CommentReport);

CommentReportDatabaseSchema.index({ commentId: 1, userId: 1 }, { unique: true });
