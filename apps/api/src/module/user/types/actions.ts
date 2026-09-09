export type CategoriesType =
  | "completed"
  | "wishlist"
  | "dropped"
  | "playing"
  | "backlog"
  | "played";

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
}

export interface IUserLogs {
  logs: ILogs[];
}

export const categories: CategoriesType[] = [
  "completed",
  "wishlist",
  "dropped",
  "playing",
  "backlog",
  "played",
];
