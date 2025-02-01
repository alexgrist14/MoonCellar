import { API_URL, gameCategories } from "../constants";
import {
  IGDBDefault,
  IGDBGame,
  IGDBGameMinimal,
  IGDBGenre,
  IGDBPlatform,
  IGDBScreenshot,
} from "../types/igdb";
import { agent } from "./agent";

export interface IGDBFilters {
  [key: string]: number[] | undefined;
  genres?: number[];
  modes?: number[];
  platforms?: number[];
  themes?: number[];
  keywords?: number[];
}

const IGDB_URL = `${API_URL}/igdb`;

const getGames = (params: {
  search?: string;
  rating?: number;
  votes?: number;
  isRandom?: boolean;
  take?: number;
  page?: number;
  selected?: IGDBFilters;
  excluded?: IGDBFilters;
  company?: string;
  years?: [number, number];
  excludeGames?: number[];
  categories?: (keyof typeof gameCategories)[];
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
    },
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

const getScreenshot = (id: number) => {
  return agent.get<IGDBScreenshot>(`${IGDB_URL}/screenshot/${id}`);
};

const getArtwork = (id: number) => {
  return agent.get<IGDBScreenshot>(`${IGDB_URL}/artwork/${id}`);
};

const getThemes = () => {
  return agent.get<IGDBDefault[]>(`${IGDB_URL}/themes`);
};

const getKeywords = () => {
  return agent.get<IGDBDefault[]>(`${IGDB_URL}/keywords`);
};

export const IGDBApi = {
  getGames,
  getGameById,
  getGameBySlug,
  getGenres,
  getPlatforms,
  getModes,
  getScreenshot,
  getArtwork,
  getThemes,
  getKeywords,
};
