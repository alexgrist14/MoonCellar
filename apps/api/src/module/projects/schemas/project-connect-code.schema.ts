import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type ProjectConnectCodeDocument = HydratedDocument<ProjectConnectCode>;

@Schema({ collection: "projectconnectcodes", timestamps: true })
export class ProjectConnectCode {
  @Prop({ type: String, required: true, unique: true })
  codeHash: string;
  @Prop({ type: String, required: true })
  slug: string;
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const ProjectConnectCodeSchema =
  SchemaFactory.createForClass(ProjectConnectCode);
ProjectConnectCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
