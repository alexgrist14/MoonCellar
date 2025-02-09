import { API_URL } from "../constants";
import { IUser } from "../types/auth";
import {
  CategoriesType,
  IFollowings,
  IUserFilter,
  IUserGames,
  IUserLogs,
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

  return agent.post<string>(
    `https://api.mooncellar.space/user/profile-picture/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

const getAvatar = (id: string) => {
  return agent.get<{ fileName: string }>(`${USER_URL}/profile-picture/${id}`);
};

const getUserGames = (id: string, category: CategoriesType) => {
  return agent.get<IUserGames>(`${USER_URL}/games/${id}?category=${category}`);
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
  return agent.patch<IFollowings>(
    `${USER_URL}/followings/${userId}/${followingId}`
  );
};

const removeUserFollowing = (userId: string, followingId: string) => {
  return agent.delete<IFollowings>(
    `${USER_URL}/followings/${userId}/${followingId}`
  );
};

const addFilter = (userId: string, filter: IUserFilter) => {
  return agent.post<Pick<IUser, "_id" | "filters">>(
    `${USER_URL}/filters/${userId}`,
    filter
  );
};

const removeFilter = (userId: string, name: string) => {
  return agent.delete<Pick<IUser, "_id" | "filters">>(
    `${USER_URL}/filters/${userId}`,
    { params: { name } }
  );
};

const getFilters = (userId: string) => {
  return agent.get<Pick<IUser, "_id" | "filters">>(
    `${USER_URL}/filters/${userId}`
  );
};

const updateDescription = (
  userId: string,
  descriptionDto: { description: string }
) => {
  return agent.patch<IUser>(
    `${USER_URL}/description/${userId}`,
    descriptionDto
  );
};

const setRaUserInfo = (
  userId: string,
  raUserName: string
)=>{
  return agent.post<IUser>(`${USER_URL}/ra/${userId}/${raUserName}`);
}

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
  addFilter,
  removeFilter,
  getFilters,
  updateDescription,
  setRaUserInfo
};
