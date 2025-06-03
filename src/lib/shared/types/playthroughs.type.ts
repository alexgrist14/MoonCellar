import { CategoriesType } from "./user.type";

export interface IPlaythroughsFetchPayload {
  userId: string;
  gameId?: number;
  category?: CategoriesType;
}

export interface IPlaythrough {
  _id: string;
  userId: string;
  gameId: number;
  category: CategoriesType;
  date?: string;
  time?: number;
  comment?: string;
  platformId?: number;
  IGDBReleaseDateId?: number;
  isMastered?: boolean;
}

export type IPlaythroughCreatePayload = Omit<IPlaythrough, "id">;
export type IPlaythroughUpdatePayload = Partial<
  Omit<IPlaythrough, "userId" | "gameId" | "id">
>;
