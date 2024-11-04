import { IUser } from "../types/auth";
import { API_URL } from "../constants";
import agent from "./agent";
import { categoriesType } from "../types/user.type";

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
  return agent.get<{ fileName: string }>(`${USER_URL}/profile-picture/${id}`);
};

const addGameToCategory = (
  userId: string,
  gameId: number,
  category: categoriesType
) => {
  return agent.patch<IUser>(
    `${USER_URL}/${userId}/games/${gameId}`,
    undefined,
    { params: { category } }
  );
};

const removeGameFromCategory = (
  userId: string,
  gameId: number,
  category: categoriesType
) => {
  return agent.delete<IUser>(`${USER_URL}/${userId}/games/${gameId}`, {
    params: { category },
  });
};

export const userAPI = {
  getById,
  getByName,
  addAvatar,
  getAvatar,
  addGameToCategory,
  removeGameFromCategory,
};
