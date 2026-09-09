import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SyncStateDocument = HydratedDocument<SyncState>;

@Schema({ collection: "igdbsyncstates" })
export class SyncState {
  @Prop({ required: true, unique: true, type: String })
  parserType: string;

  @Prop({ default: 0 })
  lastUpdatedAt: number;

  @Prop({ default: 0 })
  backfillUpdatedAt: number;

  @Prop({ default: false })
  backfillCompleted: boolean;

  @Prop()
  lastRunAt: string;

  @Prop()
  createdAt: string;

  @Prop()
  updatedAt: string;
}

export const SyncStateSchema = SchemaFactory.createForClass(SyncState);
