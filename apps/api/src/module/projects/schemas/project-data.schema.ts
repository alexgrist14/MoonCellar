import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";
import type { IProjectBlock } from "@mooncellar/schemas";

export type ProjectDataDocument = HydratedDocument<ProjectData>;

@Schema({ collection: "projectdata", timestamps: true })
export class ProjectData {
  @Prop({ type: String, required: true })
  slug: string;
  @Prop({ type: String, required: true })
  block: IProjectBlock;
  @Prop({ type: String, required: true })
  body: string;
  updatedAt: Date;
}

export const ProjectDataSchema = SchemaFactory.createForClass(ProjectData);
ProjectDataSchema.index({ slug: 1, block: 1 }, { unique: true });
