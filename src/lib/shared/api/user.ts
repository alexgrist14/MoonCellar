import { API_URL } from "../constants";
import { IUser } from "../types/auth";
import {
  CategoriesCount,
  CategoriesType,
  IFollowings,
  IUserGames,
  IUserLogs
} from "../types/user.type";
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
  return agent.get<{ fileName: string }>(`${USER_URL}/profile-picture/${id}`);
};

const getUserGames = (id: string, category: CategoriesType) => {
  return agent.get<IUserGames>(`${USER_URL}/games/${id}?category=${category}`);
};

const getUserGamesLength = (id: string) => {
  return agent.get<CategoriesCount>(`${USER_URL}/games/length/${id}`);
};

const addGameToCategory = (
  userId: string,
  gameId: number,
  category: CategoriesType
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
  category: CategoriesType
) => {
  return agent.delete<IUser>(`${USER_URL}/${userId}/games/${gameId}`, {
    params: { category },
  });
};

const addGameRating = (userId: string, game: number, rating: number) => {
  return agent.patch<IUser>(`${USER_URL}/rating/${userId}`, {
    game,
    rating,
  });
};

const removeGameRating = (userId: string, gameId: number) => {
  return agent.delete<IUser>(`${USER_URL}/rating/${userId}/${gameId}`);
};

const getUserFollowings = (userId: string) => {
  return agent.get<IFollowings>(`${USER_URL}/followings/${userId}`);
};

const getUserLogs = (userId: string) => {
  return agent.get<IUserLogs[]>(`${USER_URL}/logs/${userId}`);
};

const addUserFollowing = (userId: string, followingId: string) => {
  return agent.patch<IUser>(`${USER_URL}/followings/${userId}/${followingId}`);
};

const removeUserFollowing = (userId: string, followingId: string) => {
  return agent.delete<IUser>(`${USER_URL}/followings/${userId}/${followingId}`);
};

export const userAPI = {
  getById,
  getByName,
  addAvatar,
  getAvatar,
  addGameToCategory,
  removeGameFromCategory,
  getUserGames,
  addGameRating,
  removeGameRating,
  getUserFollowings,
  addUserFollowing,
  removeUserFollowing,
  getUserLogs,
  getUserGamesLength
};
