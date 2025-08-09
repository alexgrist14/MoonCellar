import { IUser } from "./auth.type";
import { IGDBGameMinimal } from "./igdb.type";

export type CategoriesType =
  | "completed"
  | "mastered"
  | "wishlist"
  | "dropped"
  | "playing"
  | "backlog"
  | "played";

export type CategoriesCount = Record<CategoriesType, number>;

export interface ILogs {
  _id: string;
  date: string;
  type: string;
  text: string;
  gameId: number;
  userId: string;
}

interface Game {
  cover: Cover;
  name: string;
  slug: string;
}

interface Cover {
  url: string;
}

export interface IUserLogs {
  logs: ILogs[];
}

export interface IFollowings {
  followings: Pick<IUser, "_id" | "userName" | "profilePicture">[];
}

export type UserGamesType = Record<CategoriesType, IGDBGameMinimal[]>;

export interface IUserGames {
  games: UserGamesType;
}

export interface IGamesRating {
  game: number;
  rating: number;
}

export interface IUserFilter {
  name: string;
  filter: string;
}

export interface IUserPreset {
  name: string;
  preset: number[];
}
