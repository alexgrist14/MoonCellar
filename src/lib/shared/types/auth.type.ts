import { IRole } from "../lib/schemas/role.schema";
import { IRAAward } from "./retroachievements.type";
import { IFollowings, IUserFilter, IUserPreset } from "./user.type";

export interface IAuth {
  userName: string;
  email: string;
  password: string;
}

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  followings: IFollowings;
  filters: IUserFilter[];
  presets: IUserPreset[];
  updatedAt: Date;
  createdAt: Date;
  description: string;
  raUsername?: string;
  raAwards?: IRAAward[];
  roles?: string[];
  avatar: string;
  background?: string;
}

export interface IAuthToken {
  id: string;
  username: string;
  roles: IRole[];
  email: string;
  iat: number;
  exp: number;
}
