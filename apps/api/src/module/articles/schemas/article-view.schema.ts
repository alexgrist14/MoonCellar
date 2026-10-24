import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { ARTICLE_VIEW_WINDOW_SECONDS } from "../utils/articles.utils";
import { Article } from "./article.schema";

export type ArticleViewDocument = HydratedDocument<ArticleView>;

@Schema({ timestamps: false })
export class ArticleView {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Article.name,
    required: true,
  })
  articleId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  visitor: string;
  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const ArticleViewDatabaseSchema =
  SchemaFactory.createForClass(ArticleView);

ArticleViewDatabaseSchema.index({ articleId: 1, visitor: 1 }, { unique: true });
ArticleViewDatabaseSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ARTICLE_VIEW_WINDOW_SECONDS }
);
