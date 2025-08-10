import { API_URL } from "../constants";
import {} from "../lib/schemas/playthroughs.schema";
import {
  IAddUserRatingRequest,
  IGetUserRatingsRequest,
  IRemoveUserRatingRequest,
  IUpdateUserRatingRequest,
  IUserRating,
} from "../lib/schemas/user-ratings.schema";
import agent from "./agent.api";

const RATINGS_API = `${API_URL}/ratings`;

const getAll = (params: IGetUserRatingsRequest) => {
  return agent.get<IUserRating[]>(`${RATINGS_API}`, {
    params,
  });
};

const add = (data: IAddUserRatingRequest) => {
  return agent.post<IUserRating>(`${RATINGS_API}`, data);
};

const update = (data: IUpdateUserRatingRequest) => {
  return agent.put<IUserRating>(`${RATINGS_API}`, data);
};

const remove = (params: IRemoveUserRatingRequest) => {
  return agent.delete<IUserRating>(`${RATINGS_API}`, { params });
};

export const ratingsAPI = {
  getAll,
  add,
  update,
  remove,
};
