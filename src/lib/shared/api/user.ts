import { IUser } from "../types/auth";
import { API_URL } from "../constants";
import agent from "./agent";

const USER_URL = `${API_URL}/user`;

const getById = (id: string) => {
  return agent.get<IUser>(`${USER_URL}/${id}`);
};

const getByName = (name: string) => {
  return agent.get<IUser>(`${USER_URL}/name?name=${name}`);
};

const addAvatar = (id: string, file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  return agent.post<string>(`${USER_URL}/profile-picture/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getAvatar = (id: string) => {
  return agent.get<{ fileName: string }>(
    `${API_URL}/user/profile-picture/${id}`,
  );
};

export const userAPI = {
  getById,
  getByName,
  addAvatar,
  getAvatar,
};
