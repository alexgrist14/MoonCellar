import { API_URL } from "../constants";
import { IGDBDefault, IGDBGame, IGDBGenre, IGDBPlatform } from "../types/igdb";
import { agent } from "./agent";

const getGames = (params: {
  search?: string;
  rating?: number;
  genres?: string[];
  modes?: string[];
  platforms?: string[];
  isRandom?: boolean;
  take?: number;
  page?: number;
}) => {
  return agent<IGDBGame[]>(`${API_URL}/igdb/games`, "get", { params });
};

const getGenres = () => {
  return agent<IGDBGenre[]>(`${API_URL}/igdb/genres`, "get");
};

const getPlatforms = () => {
  return agent<IGDBPlatform[]>(`${API_URL}/igdb/platforms`, "get");
};

const getModes = () => {
  return agent<IGDBDefault[]>(`${API_URL}/igdb/modes`, "get");
};

export const IGDBApi = {
  getGames,
  getGenres,
  getPlatforms,
  getModes,
};
