import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IPlatformFamily } from "src/shared/zod/schemas/platforms.schema";

export type PlatformDocument = HydratedDocument<Platform>;

@Schema()
export class Platform {
  @Prop()
  name: string;
  @Prop()
  slug: string;
  @Prop({ type: Object })
  family: IPlatformFamily;
  @Prop()
  logo: string;
  @Prop()
  generation: number;
  @Prop()
  igdbId: number;
  @Prop()
  raId: number;
  @Prop()
  createdAt: string;
  @Prop()
  updateAt: string;
}

export const PlatformDatabaseSchema = SchemaFactory.createForClass(Platform);
