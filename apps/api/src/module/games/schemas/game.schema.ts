import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import {
  IAgeRatingField,
  ICompanyField,
  IExternalPageField,
  IGDBField,
  IHltbField,
  IMultiplayerModeField,
  IReleaseDate,
  IRelatedGamesField,
  IRetroachievementsField,
} from "@mooncellar/schemas";
import { Platform } from "./platform.schema";
import { Character } from "./character.schema";
import { normalizeTitle } from "../utils/title-match.utils";

export type GameDocument = HydratedDocument<Game>;

@Schema()
export class Game {
  @Prop()
  slug: string;
  @Prop()
  name: string;
  @Prop()
  nameNormalized: string;
  @Prop()
  type: string;
  @Prop()
  cover: string;
  @Prop()
  storyline: string;
  @Prop()
  summary: string;
  @Prop()
  modes: string[];
  @Prop()
  genres: string[];
  @Prop()
  keywords: string[];
  @Prop()
  themes: string[];
  @Prop()
  screenshots: string[];
  @Prop()
  artworks: string[];
  @Prop()
  franchises: string[];
  @Prop()
  videos: string[];
  @Prop()
  alternative_names: string[];
  @Prop({ type: [Object] })
  companies: ICompanyField[];
  @Prop()
  websites: string[];
  @Prop()
  first_release: number;
  @Prop({ type: [Object] })
  release_dates: IReleaseDate[];
  @Prop({ ref: Platform.name })
  platformIds: mongoose.Types.ObjectId[];
  @Prop()
  status: string;
  @Prop()
  versionTitle: string;
  @Prop()
  game_engines: string[];
  @Prop()
  player_perspectives: string[];
  @Prop({ type: [Object] })
  multiplayer_modes: IMultiplayerModeField[];
  @Prop({ type: [Object] })
  ageRatings: IAgeRatingField[];
  @Prop()
  languages: string[];
  @Prop({ type: [Object] })
  externalPages: IExternalPageField[];
  @Prop({ type: Object })
  relatedGames: IRelatedGamesField;
  @Prop({ ref: Character.name })
  characters: mongoose.Types.ObjectId[];
  @Prop({ type: [Object] })
  retroachievements: IRetroachievementsField[];
  @Prop()
  averageRating: number;
  @Prop()
  ratingsCount: number;
  @Prop({ default: false })
  isStopParsingPictures: boolean;
  @Prop({ default: false })
  isStopParsing: boolean;
  @Prop({ default: false })
  isCustom: boolean;
  @Prop({ type: Object })
  igdb: IGDBField;
  @Prop({ type: Object })
  hltb: IHltbField;
  @Prop()
  hltbNotFoundAt: string;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}

export const GameDatabaseSchema = SchemaFactory.createForClass(Game);
GameDatabaseSchema.index({ slug: 1 }, { unique: true });
GameDatabaseSchema.index({ "igdb.gameId": 1 });
GameDatabaseSchema.index({ "hltb.updatedAt": 1, _id: 1 });
GameDatabaseSchema.index({ "externalPages.name": 1, "externalPages.uid": 1 });
GameDatabaseSchema.index({ hltbNotFoundAt: 1 });
GameDatabaseSchema.index({ createdAt: -1 });
GameDatabaseSchema.index({ "igdb.total_rating_count": -1 });
GameDatabaseSchema.index({ "igdb.total_rating": -1 });
GameDatabaseSchema.index({ first_release: -1 });
GameDatabaseSchema.index({ name: 1 });
GameDatabaseSchema.index({ nameNormalized: 1 });
GameDatabaseSchema.index({ characters: 1 });

GameDatabaseSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    const normalized = normalizeTitle(this.name);

    normalized
      ? (this.nameNormalized = normalized)
      : (this.nameNormalized = undefined);
  }

  next();
});

GameDatabaseSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    const update = this.getUpdate();

    if (!update || Array.isArray(update)) return next();

    const name = update.$set?.name ?? (update as Record<string, unknown>).name;

    if (typeof name !== "string") return next();

    const normalized = normalizeTitle(name);

    if (normalized) {
      if (update.$set) {
        update.$set.nameNormalized = normalized;
      } else {
        (update as Record<string, unknown>).nameNormalized = normalized;
      }
    } else {
      update.$unset = { ...update.$unset, nameNormalized: "" };
    }

    this.setUpdate(update);

    next();
  }
);
