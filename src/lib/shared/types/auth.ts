import { CategoriesType, IGamesRating, ILogs } from "./user.type";

export interface IAuth {
  userName: string;
  email: string;
  password: string;
}

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  games: Record<CategoriesType, number[]>;
  gamesRating: IGamesRating[];
  profilePicture: string;
  followings: string[];
}
