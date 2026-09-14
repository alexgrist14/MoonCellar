import type { Request } from "express";
import type mongoose from "mongoose";
import type { User } from "../../user/schemas/user.schema";
import type { Playthrough } from "../../games/schemas/playthroughs.schema";
import type { GameComment } from "../schemas/game-comment.schema";

export type IViewer = User | null | undefined;

export type ICommunityRequest = Request & { user?: User | null };

export type IAuthorizedRequest = Request & { user: User };

export type IObjectIdLike =
  | mongoose.Types.ObjectId
  | mongoose.Schema.Types.ObjectId
  | string;

export type ILeanComment = GameComment & { _id: mongoose.Types.ObjectId };

export type ILeanPlaythrough = Playthrough & { _id: mongoose.Types.ObjectId };
