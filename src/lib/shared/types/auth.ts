import { categoriesType, IGamesRating, ILogs } from "./user.type";

export interface IAuth {
  userName: string;
  email: string;
  password: string;
}

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  games: Record<categoriesType, number[]>;
  gamesRating: IGamesRating[];
  profilePicture: string;
  followings: string[];
}
