import { IAuth } from "@/src/lib/shared/types/auth.type";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const AUTH_URL = `${API_URL}/auth`;

const signup = (signUpDto: IAuth) => {
  return agent.post<{ userId: string }>(`${AUTH_URL}/signup`, signUpDto);
};

const login = (loginDto: Omit<IAuth, "userName">) => {
  return agent.post<{ userId: string }>(`${AUTH_URL}/login`, loginDto);
};

const logout = (userId: string) => {
  return agent.post<{ message: string }>(`${AUTH_URL}/${userId}/logout`);
};

const refreshToken = () => {
  return agent.post<{ userId: string }>(`${AUTH_URL}/refresh-token`);
};

export const authAPI = {
  signup,
  login,
  logout,
  refreshToken,
};
