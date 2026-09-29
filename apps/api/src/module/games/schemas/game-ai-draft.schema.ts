import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";
import type { IAddGameRequest, IGameAiDraftRun } from "@mooncellar/schemas";

export type GameAiDraftDocument = HydratedDocument<GameAiDraft>;

@Schema({ collection: "gameaidrafts", timestamps: true })
export class GameAiDraft {
  @Prop({ type: String, required: true })
  query: string;
  @Prop({ type: String, required: true, default: "running" })
  status: IGameAiDraftRun["status"];
  @Prop({ type: [String], default: [] })
  steps: string[];
  @Prop({ type: String, default: null })
  error: string | null;
  @Prop({ type: Object, default: null })
  draft: Partial<IAddGameRequest> | null;
}

export const GameAiDraftDatabaseSchema =
  SchemaFactory.createForClass(GameAiDraft);
GameAiDraftDatabaseSchema.index({ createdAt: -1 });
