import { categoriesType } from "./user.type";

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  userName: string;
  email: string;
  password: string;
}

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
  profilePicture: string;
}
