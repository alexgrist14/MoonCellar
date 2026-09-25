import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";

@Schema({ _id: false })
export class CustomListGame {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true })
  gameId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  addedAt: Date;
}

export const CustomListGameDatabaseSchema =
  SchemaFactory.createForClass(CustomListGame);

export type ICustomListGeneratorKind = "decade" | "genre" | "platform";

@Schema({ _id: false })
export class CustomListGenerator {
  @Prop({ type: String, required: true })
  kind: ICustomListGeneratorKind;

  @Prop({ type: String, required: true })
  key: string;
}

export const CustomListGeneratorDatabaseSchema =
  SchemaFactory.createForClass(CustomListGenerator);

@Schema({ timestamps: true, collection: "customlists" })
export class CustomList {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  nameNormalized: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: [String], default: [] })
  previousSlugs: string[];

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: Boolean, default: false })
  isPrivate: boolean;

  @Prop({ type: Boolean, default: false })
  isRanked: boolean;

  @Prop({ type: [CustomListGameDatabaseSchema], default: [] })
  games: CustomListGame[];

  @Prop({ type: Number, default: 0 })
  gamesCount: number;

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({ type: CustomListGeneratorDatabaseSchema, required: false })
  generator?: CustomListGenerator;

  createdAt: Date;

  updatedAt: Date;
}

export type CustomListDocument = HydratedDocument<CustomList>;

export const CustomListDatabaseSchema =
  SchemaFactory.createForClass(CustomList);

CustomListDatabaseSchema.index({ userId: 1, slug: 1 }, { unique: true });
CustomListDatabaseSchema.index({ userId: 1, previousSlugs: 1 });
CustomListDatabaseSchema.index({ "games.gameId": 1 });
CustomListDatabaseSchema.index({ isPrivate: 1, updatedAt: -1 });
CustomListDatabaseSchema.index(
  { "generator.kind": 1, "generator.key": 1 },
  {
    unique: true,
    partialFilterExpression: { "generator.kind": { $exists: true } },
  }
);
