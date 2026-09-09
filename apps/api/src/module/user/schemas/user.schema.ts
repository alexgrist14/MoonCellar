import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MaxLength } from "class-validator";
import mongoose, { Document } from "mongoose";
import {
  type IRAAward,
  type IRole,
  DEFAULT_BG_OPACITY,
  IUserSettings,
} from "@mooncellar/schemas";

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
  @Prop({ type: [Object] })
  raAwards: IRAAward[];
  @Prop({ type: [String], default: ["user"] })
  roles: IRole[];
  @Prop()
  avatar: string;
  @Prop()
  background: string;
  @Prop({
    type: Object,
    default: { showAdultContent: false, bgOpacity: DEFAULT_BG_OPACITY },
  })
  settings: IUserSettings;
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
