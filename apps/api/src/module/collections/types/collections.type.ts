import type { Request } from "express";
import type { User } from "../../user/schemas/user.schema";

export type ICollectionsViewer = User | null | undefined;

export type IOptionalViewerRequest = Request & { user?: User | null };

export type IViewerRequest = Request & { user: User };
