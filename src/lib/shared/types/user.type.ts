import { IUser } from "./auth";
import { IGDBGameMinimal } from "./igdb";

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
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
  game: {
    cover: {
      url: string;
    };
    name: string;
    slug: string;
  };
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
  preset: string;
}
