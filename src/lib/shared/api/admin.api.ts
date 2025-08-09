import { API_URL } from "../constants";
import { IRole } from "../lib/schemas/role.schema";
import agent from "./agent.api";

const ADMIN_URL = `${API_URL}/admin`;

const getUsers = () => {
  return agent.get(`${ADMIN_URL}/users`);
};

const getUserById = (id: string) => {
  return agent.get(`${ADMIN_URL}/users/${id}`);
};

const setUserRole = (userId: string, role: IRole) => {
  return agent.patch(`${ADMIN_URL}/users/${userId}/role`, { role });
};

export const adminUsersApi = {
  getUsers,
  getUserById,
  setUserRole,
};
