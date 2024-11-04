import { categoriesType } from "./user.type";

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  name: string;
  email: string;
  password: string;
}

export interface IAuth {
  name: string;
  email: string;
  password: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  games: Record<categoriesType, number[]>;
  avatar: string;
}
