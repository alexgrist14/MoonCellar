import { IGameResponse, ILog } from "@mooncellar/schemas";
import { IUser } from "./auth.type";

export type CategoriesType =
  | "completed"
  | "mastered"
  | "wishlist"
  | "dropped"
  | "playing"
  | "backlog"
  | "played";

export type CategoriesFilterType = CategoriesType | "all";

export type CategoriesCount = Record<CategoriesType, number>;

export type ILogs = Omit<ILog, "date"> & { date: string };

export interface IUserLogs {
  logs: ILogs[];
}

export interface IFollowings {
  followings: Pick<IUser, "_id" | "userName" | "avatar">[];
}

export interface IFollowers {
  followers: Pick<IUser, "_id" | "userName" | "avatar">[];
}

export type UserGamesType = Record<CategoriesType, IGameResponse[]>;

export interface IUserGames {
  games: UserGamesType;
}

export interface IUserFilter {
  name: string;
  filter: string;
}

export interface IUserPreset {
  name: string;
  preset: string[];
}
