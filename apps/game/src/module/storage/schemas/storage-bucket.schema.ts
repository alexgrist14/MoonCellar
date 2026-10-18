import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type StorageBucketDocument = HydratedDocument<StorageBucket>;

@Schema({ collection: "storage_buckets", timestamps: true })
export class StorageBucket {
  @Prop({ type: String, required: true })
  game: string;
  @Prop({ type: String, required: true })
  bucket: string;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: Number, default: 0 })
  revision: number;
  @Prop({ type: Number, default: 0 })
  usedBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

export const StorageBucketSchema = SchemaFactory.createForClass(StorageBucket);
StorageBucketSchema.index({ game: 1, bucket: 1, userId: 1 }, { unique: true });
