import { IRAAward } from "./retroachievements.type";
import {
  CategoriesType,
  IFollowings,
  IGamesRating,
  IUserFilter,
  IUserPreset,
} from "./user.type";

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
  followings: IFollowings;
  filters: IUserFilter[];
  presets: IUserPreset[];
  updatedAt: Date;
  createdAt: Date;
  description: string;
  raUsername?: string;
  raAwards?: IRAAward[];
  roles?: string[];
  background?: string;
}

export interface IAuthToken {
  id: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
