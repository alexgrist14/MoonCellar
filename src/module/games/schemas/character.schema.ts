import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ICharacterIGDBField } from "src/shared/zod/schemas/characters.schema";

export type CharacterDocument = HydratedDocument<Character>;

@Schema()
export class Character {
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop()
  akas: string[];
  @Prop()
  description: string;
  @Prop()
  gender: string;
  @Prop()
  species: string;
  @Prop()
  countryName: string;
  @Prop()
  mugShot: string;
  @Prop({ ref: "Game" })
  gameIds: mongoose.Types.ObjectId[];
  @Prop({ type: Object })
  igdb: ICharacterIGDBField;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const CharacterDatabaseSchema = SchemaFactory.createForClass(Character);
CharacterDatabaseSchema.index({ "igdb.characterId": 1 }, { unique: true });
CharacterDatabaseSchema.index({ slug: 1 });
CharacterDatabaseSchema.index({ name: 1 });
CharacterDatabaseSchema.index({ gameIds: 1 });
