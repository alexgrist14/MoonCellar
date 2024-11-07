import { IGDBGame } from "./igdb";

export type categoriesType =
  | 'completed'
  | 'wishlist'
  | 'dropped'
  | 'playing'
  | 'backlog';

export interface ILogs {
  date: Date;
  action: string;
  isAdd: boolean;
  rating?: number;
  gameId: number;
}

export type UserGamesType = Record<categoriesType, IGDBGame[]>;

export interface IUserGames {
  games: UserGamesType;
}

export interface IGamesRating{
  game: number;
  rating: number;
}
