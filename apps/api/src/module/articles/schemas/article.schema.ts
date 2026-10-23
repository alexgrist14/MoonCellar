import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { type IArticleStatus, type IArticleType } from "@mooncellar/schemas";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true, unique: true })
  slug: string;
  @Prop({ type: String, required: true })
  type: IArticleType;
  @Prop({ type: String, required: true, default: "draft" })
  status: IArticleStatus;
  @Prop({ required: true })
  title: string;
  @Prop({ default: "" })
  summary: string;
  @Prop({ type: String, default: null })
  image: string | null;
  @Prop({ default: "" })
  content: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Game.name, default: null })
  gameId: mongoose.Types.ObjectId | null;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  authorId: mongoose.Types.ObjectId;
  @Prop({ default: 1 })
  readingMinutes: number;
  @Prop({ type: Date, default: null })
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ArticleDatabaseSchema = SchemaFactory.createForClass(Article);

ArticleDatabaseSchema.index({ status: 1, publishedAt: -1 });
ArticleDatabaseSchema.index({ gameId: 1, status: 1, publishedAt: -1 });
