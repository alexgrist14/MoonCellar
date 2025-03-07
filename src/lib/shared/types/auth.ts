import { IRAAward } from "./retroachievements";
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
  description: string;
  raUsername?: string;
  raAwards?: IRAAward[];
  background?: string;
}
