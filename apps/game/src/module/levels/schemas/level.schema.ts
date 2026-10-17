import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type LevelDocument = HydratedDocument<Level>;

@Schema({ _id: false })
export class LevelRating {
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: Number, required: true })
  stars: number;
}

@Schema({ _id: false })
export class LevelReport {
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  reason: string;
  @Prop({ type: Date, required: true })
  at: Date;
}

@Schema({ collection: "levels", timestamps: true })
export class Level {
  @Prop({ type: String, required: true })
  game: string;
  @Prop({ type: String, required: true })
  authorId: string;
  @Prop({ type: String, required: true })
  authorName: string;
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String, default: "" })
  description: string;
  @Prop({ type: String, required: true })
  base: string;
  @Prop({ type: Buffer, required: true, select: false })
  data: Buffer;
  @Prop({ type: Number, required: true })
  size: number;
  @Prop({ type: Number, default: 1 })
  version: number;
  @Prop({ type: [LevelRating], default: [], select: false })
  ratingList: LevelRating[];
  @Prop({ type: Number, default: 0 })
  ratingSum: number;
  @Prop({ type: Number, default: 0 })
  ratingCount: number;
  @Prop({ type: Number, default: 0 })
  rating: number;
  @Prop({ type: Number, default: 0 })
  downloads: number;
  @Prop({ type: [LevelReport], default: [], select: false })
  reports: LevelReport[];
  @Prop({ type: Number, default: 0 })
  reportCount: number;
  @Prop({ type: Boolean, default: false })
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
LevelSchema.index({ game: 1, hidden: 1, createdAt: -1 });
LevelSchema.index({ game: 1, hidden: 1, rating: -1, ratingCount: -1 });
LevelSchema.index({ game: 1, authorId: 1 });
