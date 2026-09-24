import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import {
  type ICharacterIGDBField,
  type ICharacterTrait,
  type ICharacterVndbField,
} from "@mooncellar/schemas";

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
  @Prop()
  isExplicitImage: boolean;
  @Prop({ type: [Object] })
  traits: ICharacterTrait[];
  @Prop({ ref: "Game" })
  gameIds: mongoose.Types.ObjectId[];
  @Prop({ type: Object })
  igdb: ICharacterIGDBField;
  @Prop({ type: Object })
  vndb: ICharacterVndbField;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const CharacterDatabaseSchema = SchemaFactory.createForClass(Character);
CharacterDatabaseSchema.index(
  { "igdb.characterId": 1 },
  {
    unique: true,
    partialFilterExpression: { "igdb.characterId": { $exists: true } },
  }
);
CharacterDatabaseSchema.index(
  { "vndb.characterId": 1 },
  {
    unique: true,
    partialFilterExpression: { "vndb.characterId": { $exists: true } },
  }
);
CharacterDatabaseSchema.index({ slug: 1 });
CharacterDatabaseSchema.index({ name: 1 });
CharacterDatabaseSchema.index({ gameIds: 1 });
