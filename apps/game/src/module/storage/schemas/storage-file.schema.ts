import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type StorageFileDocument = HydratedDocument<StorageFile>;

@Schema({ collection: "storage_files", timestamps: true })
export class StorageFile {
  @Prop({ type: String, required: true })
  game: string;
  @Prop({ type: String, required: true })
  bucket: string;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  path: string;
  @Prop({ type: Buffer, required: true, select: false })
  data: Buffer;
  @Prop({ type: Number, required: true })
  size: number;
  @Prop({ type: String, required: true })
  sha256: string;
  createdAt: Date;
  updatedAt: Date;
}

export const StorageFileSchema = SchemaFactory.createForClass(StorageFile);
StorageFileSchema.index(
  { game: 1, bucket: 1, userId: 1, path: 1 },
  { unique: true }
);
