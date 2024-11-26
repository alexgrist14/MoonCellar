import { API_URL } from "../constants";
import {
  IGDBDefault,
  IGDBGame,
  IGDBGameMinimal,
  IGDBGenre,
  IGDBPlatform,
  IGDBScreenshot,
} from "../types/igdb";
import { agent } from "./agent";

interface IGDBFilters {
  genres?: number[];
  modes?: number[];
  platforms?: number[];
}

const IGDB_URL = `${API_URL}/igdb`;

const getGames = (params: {
  search?: string;
  rating?: number;
  isRandom?: boolean;
  take?: number;
  page?: number;
  selected?: IGDBFilters;
  excluded?: IGDBFilters;
}) => {
  return agent.get<{ results: IGDBGameMinimal[]; total: number }>(
    `${IGDB_URL}/games`,
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
  return agent.get<IGDBGame>(`${IGDB_URL}/by-id/${id}`);
};

const getGameBySlug = (slug: string) => {
  return agent.get<IGDBGame>(`${IGDB_URL}/by-slug/${slug}`);
};

const getGenres = () => {
  return agent.get<IGDBGenre[]>(`${IGDB_URL}/genres`);
};

const getPlatforms = () => {
  return agent.get<IGDBPlatform[]>(`${IGDB_URL}/platforms`);
};

const getModes = () => {
  return agent.get<IGDBDefault[]>(`${IGDB_URL}/modes`);
};

const getArt = (id: number) => {
  return agent.get<IGDBScreenshot>(`${IGDB_URL}/art/${id}`);
};

export const IGDBApi = {
  getGames,
  getGameById,
  getGameBySlug,
  getGenres,
  getPlatforms,
  getModes,
  getArt,
};
