import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type SiteSessionDocument = HydratedDocument<SiteSession>;

@Schema({ collection: "sitesessions", timestamps: true })
export class SiteSession {
  @Prop({ type: String, required: true, unique: true })
  domain: string;
  @Prop({ type: String, default: null })
  cookie: string | null;
  @Prop({ type: String, default: null })
  userAgent: string | null;
  @Prop({ type: String, default: null })
  referer: string | null;
  updatedAt: Date;
}

export const SiteSessionSchema = SchemaFactory.createForClass(SiteSession);
