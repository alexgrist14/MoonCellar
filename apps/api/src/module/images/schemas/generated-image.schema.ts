import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { type HydratedDocument } from "mongoose";
import { type IImageProvider } from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";

export type GeneratedImageDocument = HydratedDocument<GeneratedImage>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class GeneratedImage {
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  prompt: string;
  @Prop({ type: String, required: true })
  provider: IImageProvider;
  @Prop({ required: true })
  model: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export const GeneratedImageSchema =
  SchemaFactory.createForClass(GeneratedImage);
