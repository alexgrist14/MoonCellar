import { API_URL } from "../constants";
import { IGDBDefault, IGDBGame, IGDBGenre, IGDBPlatform } from "../types/igdb";
import { agent } from "./agent";

interface IGDBFilters {
  genres?: number[];
  modes?: number[];
  platforms?: number[];
}

const getGames = (params: {
  search?: string;
  rating?: number;
  isRandom?: boolean;
  take?: number;
  page?: number;
  selected?: IGDBFilters;
  excluded?: IGDBFilters;
}) => {
  return agent<{ results: IGDBGame[]; total: number }>(
    `${API_URL}/igdb/games`,
    "get",
    {
      params: {
        ...params,
        selected: !!params.selected
          ? JSON.stringify(params.selected)
          : undefined,
        excluded: !!params.excluded
          ? JSON.stringify(params.excluded)
          : undefined,
      },
    }
  );
};

const getGameById = (id: string) => {
  return agent<IGDBGame>(`${API_URL}/igdb/by-id/${id}`, "get");
};

const getGameBySlug = (slug: string) => {
  return agent<IGDBGame>(`${API_URL}/igdb/by-slug/${slug}`, "get");
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
  getGameById,
  getGameBySlug,
  getGenres,
  getPlatforms,
  getModes,
};
