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
  name?: string;
  email: string;
  password: string;
}

export interface IUser {
    id: string;
    name: string;
    email: string;
}
