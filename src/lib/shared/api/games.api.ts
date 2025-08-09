import { API_URL } from "../constants";
import {
  IGetPlaythroughsMinimalResponse,
  IGetPlaythroughsRequest,
  IGetPlaythroughsResponse,
  IPlaythrough,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "../lib/schemas/playthroughs.schema";
import agent from "./agent.api";

const GAMES_API = `${API_URL}/games`;

const getPlaythroughs = (params: IGetPlaythroughsRequest) => {
  return agent.get<IGetPlaythroughsResponse>(`${GAMES_API}/playthroughs`, {
    params,
  });
};

const getPlaythroughsMinimal = (params: IGetPlaythroughsRequest) => {
  return agent.get<IGetPlaythroughsMinimalResponse>(
    `${GAMES_API}/playthroughs/minimal`,
    { params }
  );
};

const createPlaythrough = (data: ISavePlaythroughRequest) => {
  return agent.post<IPlaythrough>(`${GAMES_API}/save-playthrough`, data);
};

const updatePlaythrough = (
  userId: string,
  id: string,
  data: IUpdatePlaythroughRequest
) => {
  return agent.put<IPlaythrough>(
    `${GAMES_API}/update-playthrough/${userId}/${id}`,
    data
  );
};

const deletePlaythrough = (userId: string, id: string) => {
  return agent.delete<IPlaythrough>(
    `${GAMES_API}/delete-playthrough/${userId}/${id}`
  );
};

export const gamesAPI = {
  getPlaythroughs,
  getPlaythroughsMinimal,
  createPlaythrough,
  updatePlaythrough,
  deletePlaythrough,
};
