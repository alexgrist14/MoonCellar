import { API_URL } from "../constants";
import { IConsole, IGame } from "../types/responses";
import { agent } from "./agent";

const getRandomGames = (platformIds: string, onlyWithAchievements: boolean) => {
  return agent<{ [key: number]: IGame[] }>(`${API_URL}/retrogames`, "get", {
    params: { platformIds, onlyWithAchievements },
  });
};

const getConsoles = () => {
  return agent<IConsole[]>(`${API_URL}/ra-consoles`, "get");
};

export const RetroachievementsApi = {
  getRandomGames,
  getConsoles,
};
