import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import type {
  IContentRequestAction,
  IContentRequestKind,
  IContentRequestStatus,
} from "@mooncellar/schemas";

export type ContentRequestDocument = HydratedDocument<ContentRequest>;

@Schema({ collection: "contentrequests" })
export class ContentRequest {
  @Prop({ type: String, required: true })
  kind: IContentRequestKind;
  @Prop({ type: String, required: true })
  action: IContentRequestAction;
  @Prop({ type: String, required: true, default: "pending" })
  status: IContentRequestStatus;
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  targetId: mongoose.Types.ObjectId | null;
  @Prop({ type: Object, required: true })
  payload: Record<string, unknown>;
  @Prop({ type: [String], default: [] })
  sources: string[];
  @Prop({ type: String, default: null })
  note: string | null;
  @Prop({ type: String, default: null })
  reason: string | null;
  @Prop({ type: [String], default: undefined })
  appliedFields?: string[];
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
  decidedBy: mongoose.Types.ObjectId | null;
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  resultId: mongoose.Types.ObjectId | null;
  @Prop({ type: String, required: true })
  createdAt: string;
  @Prop({ type: String, default: null })
  decidedAt: string | null;
}

export const ContentRequestDatabaseSchema =
  SchemaFactory.createForClass(ContentRequest);
ContentRequestDatabaseSchema.index({ status: 1, createdAt: -1 });
ContentRequestDatabaseSchema.index({ userId: 1, createdAt: -1 });
