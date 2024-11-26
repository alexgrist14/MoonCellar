import { IUser } from "./auth";
import { IGDBGame, IGDBGameMinimal } from "./igdb";

export type categoriesType =
  | "completed"
  | "wishlist"
  | "dropped"
  | "playing"
  | "backlog"
  | "mastered"
  | "played";

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
}

export interface IFollowings {
  followings: Pick<IUser, "_id" | "userName" | "profilePicture">[];
}

export type UserGamesType = Record<categoriesType, IGDBGameMinimal[]>;

export interface IUserGames {
  games: UserGamesType;
}

export interface IGamesRating {
  game: number;
  rating: number;
}
