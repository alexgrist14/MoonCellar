import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";

export type PushSubscriptionDocument = HydratedDocument<PushSubscription>;

@Schema({ collection: "pushsubscriptions", timestamps: true })
export class PushSubscription {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  endpoint: string;
  @Prop({ type: Object, required: true })
  keys: { p256dh: string; auth: string };
}

export const PushSubscriptionDatabaseSchema =
  SchemaFactory.createForClass(PushSubscription);
PushSubscriptionDatabaseSchema.index({ endpoint: 1 }, { unique: true });
PushSubscriptionDatabaseSchema.index({ userId: 1 });
