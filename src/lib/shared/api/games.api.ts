import { API_URL } from "../constants";
import {
  IPlaythrough,
  IPlaythroughCreatePayload,
  IPlaythroughsFetchPayload,
  IPlaythroughUpdatePayload,
} from "../types/playthroughs.type";
import agent from "./agent";

const GAMES_API = `${API_URL}/games`;

const getPlaythroughs = (params: IPlaythroughsFetchPayload) => {
  return agent.get<IPlaythrough[]>(`${GAMES_API}/playthroughs`, { params });
};

const createPlaythrough = (data: IPlaythroughCreatePayload) => {
  return agent.post<IPlaythrough[]>(`${GAMES_API}/save-playthrough`, data);
};

const updatePlaythrough = (id: string, data: IPlaythroughUpdatePayload) => {
  return agent.put<IPlaythrough>(`${GAMES_API}/update-playthrough/${id}`, data);
};

const deletePlaythrough = (id: string) => {
  return agent.delete<IPlaythrough>(`${GAMES_API}/delete-playthrough/${id}`);
};

export const gamesAPI = {
  getPlaythroughs,
  createPlaythrough,
  updatePlaythrough,
  deletePlaythrough,
};
