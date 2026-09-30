import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type HydratedDocument } from "mongoose";
import type {
  IAddGameRequest,
  IGameAiDraftRun,
  ISaveCharacterRequest,
} from "@mooncellar/schemas";

export type IAiDraftKind = "game" | "character";

export type GameAiDraftDocument = HydratedDocument<GameAiDraft>;

@Schema({ collection: "gameaidrafts", timestamps: true })
export class GameAiDraft {
  @Prop({ type: String, required: true })
  query: string;
  @Prop({ type: String, default: "game" })
  kind: IAiDraftKind;
  @Prop({ type: Number, default: 1 })
  count: number;
  @Prop({ type: String, required: true, default: "running" })
  status: IGameAiDraftRun["status"];
  @Prop({ type: [String], default: [] })
  steps: string[];
  @Prop({ type: String, default: null })
  error: string | null;
  @Prop({ type: Object, default: null })
  draft: Partial<IAddGameRequest> | ISaveCharacterRequest | null;
}

export const GameAiDraftDatabaseSchema =
  SchemaFactory.createForClass(GameAiDraft);
GameAiDraftDatabaseSchema.index({ createdAt: -1 });
