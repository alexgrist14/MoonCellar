import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";

export type ProjectPlanDocument = HydratedDocument<ProjectPlan>;

@Schema({ _id: false })
export class PlanSectionEntry {
  @Prop({ type: String, required: true })
  id: string;
  @Prop({ type: String, required: true })
  title: string;
}

export const PlanSectionEntrySchema =
  SchemaFactory.createForClass(PlanSectionEntry);

@Schema({ _id: false })
export class PlanTaskEntry {
  @Prop({ type: String, required: true })
  id: string;
  @Prop({ type: String, required: true })
  section: string;
  @Prop({ type: String, required: true })
  title: string;
  @Prop({ type: String, default: null })
  where: string | null;
  @Prop({ type: [String], default: [] })
  depends: string[];
  @Prop({ type: String, default: null })
  doneWhen: string | null;
  @Prop({ type: String, default: null })
  size: string | null;
  @Prop({ type: Boolean, default: false })
  done: boolean;
  @Prop({ type: Date, default: null })
  doneAt: Date | null;
  @Prop({ type: String, default: null })
  doneBy: string | null;
  @Prop({ type: String, default: null })
  owner: string | null;
  @Prop({ type: Date, default: null })
  takenAt: Date | null;
  @Prop({ type: String, default: null })
  note: string | null;
  @Prop({ type: Date, required: true })
  createdAt: Date;
  @Prop({ type: String, default: null })
  createdBy: string | null;
}

export const PlanTaskEntrySchema = SchemaFactory.createForClass(PlanTaskEntry);

@Schema({ collection: "projectplans", timestamps: true })
export class ProjectPlan {
  @Prop({ type: String, required: true, unique: true })
  slug: string;
  @Prop({ type: [PlanSectionEntrySchema], default: [] })
  sections: PlanSectionEntry[];
  @Prop({ type: [PlanTaskEntrySchema], default: [] })
  tasks: PlanTaskEntry[];
  @Prop({ type: Number, default: 0 })
  version: number;
  updatedAt: Date;
}

export const ProjectPlanSchema = SchemaFactory.createForClass(ProjectPlan);

@Schema({ collection: "projectplanevents" })
export class ProjectPlanEvent {
  @Prop({ type: String, required: true })
  slug: string;
  @Prop({ type: Date, required: true })
  at: Date;
  @Prop({ type: String, required: true })
  by: string;
  @Prop({ type: String, required: true })
  action: string;
  @Prop({ type: String, default: null })
  taskId: string | null;
  @Prop({ type: String, default: null })
  sectionId: string | null;
  @Prop({ type: String, default: null })
  text: string | null;
}

export const ProjectPlanEventSchema =
  SchemaFactory.createForClass(ProjectPlanEvent);
ProjectPlanEventSchema.index({ slug: 1, at: -1 });
ProjectPlanEventSchema.index({ slug: 1, taskId: 1, at: -1 });
