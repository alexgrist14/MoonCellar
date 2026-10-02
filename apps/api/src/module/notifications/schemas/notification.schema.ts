import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import type {
  INotificationPayload,
  INotificationType,
} from "@mooncellar/schemas";

export type NotificationDocument = HydratedDocument<Notification>;

export const NOTIFICATION_TTL_SECONDS = 90 * 24 * 60 * 60;

@Schema({ collection: "notifications", timestamps: true })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  type: INotificationType;
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  subjectId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  groupKey: string;
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] })
  actorIds: mongoose.Types.ObjectId[];
  @Prop({ type: Object, default: {} })
  payload: INotificationPayload;
  @Prop({ type: Boolean, default: false })
  isRead: boolean;
  @Prop({ type: Date, default: null })
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationDatabaseSchema =
  SchemaFactory.createForClass(Notification);
NotificationDatabaseSchema.index({ userId: 1, updatedAt: -1 });
NotificationDatabaseSchema.index({ userId: 1, isRead: 1 });
NotificationDatabaseSchema.index({ subjectId: 1 });
NotificationDatabaseSchema.index(
  { userId: 1, groupKey: 1 },
  { unique: true, partialFilterExpression: { isRead: false } }
);
NotificationDatabaseSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: NOTIFICATION_TTL_SECONDS }
);
