import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MaxLength } from "class-validator";
import mongoose, { Document } from "mongoose";
import {
  type IRAAward,
  type IRaPending,
  type IRole,
  DEFAULT_BG_OPACITY,
  type IUserSettings,
} from "@mooncellar/schemas";

@Schema({ _id: false })
export class UserSteamAccount {
  @Prop({ type: String, required: true })
  steamId: string;
  @Prop({ type: Date, required: true })
  linkedAt: Date;
  @Prop({ type: Date, default: null })
  syncedAt: Date | null;
}

export const UserSteamAccountSchema =
  SchemaFactory.createForClass(UserSteamAccount);

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true, required: true })
  userName: string;
  @Prop({ unique: [true, "Duplicate email entered"] })
  email: string;
  @Prop()
  password: string;
  @Prop()
  refreshToken?: string;
  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] })
  followings: mongoose.Types.ObjectId[];
  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] })
  followers: mongoose.Types.ObjectId[];
  @Prop({ type: [Object] })
  filters: { name: string; filter: string }[];
  @Prop({ type: [Object] })
  presets: { name: string; preset: string }[];
  @Prop()
  @MaxLength(450)
  description?: string;
  @Prop()
  raUsername?: string;
  @Prop()
  raUlid?: string;
  @Prop()
  raUserPic?: string;
  @Prop()
  raVerifiedAt?: string;
  @Prop()
  raSyncedAt?: string;
  @Prop({ type: Object, default: null })
  raPending?: IRaPending | null;
  @Prop({ type: [Object] })
  raAwards: IRAAward[];
  @Prop({ type: UserSteamAccountSchema, required: false })
  steam?: UserSteamAccount;
  @Prop({ type: [String], default: ["user"] })
  roles: IRole[];
  @Prop()
  avatar: string;
  @Prop()
  background: string;
  @Prop({
    type: Object,
    default: {
      showAdultContent: false,
      bgOpacity: DEFAULT_BG_OPACITY,
      mutedNotifications: [],
    },
  })
  settings: IUserSettings;
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    default: [],
  })
  royalGames: mongoose.Types.ObjectId[];
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    default: [],
  })
  favorites: mongoose.Types.ObjectId[];
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    default: [],
  })
  favoriteCharacters: mongoose.Types.ObjectId[];
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { "steam.steamId": 1 },
  {
    unique: true,
    partialFilterExpression: { "steam.steamId": { $exists: true } },
  }
);
