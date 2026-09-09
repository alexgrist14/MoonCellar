import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Platform } from "src/module/games/schemas/platform.schema";

@Schema()
export class RAConsole {
  @Prop()
  _id: number;
  @Prop()
  name: string;
  @Prop()
  iconUrl: string;
  @Prop({ ref: Platform.name })
  moonId: mongoose.Types.ObjectId[];
}

export const RAConsoleSchema = SchemaFactory.createForClass(RAConsole);
