import { IGDBFilters } from "../api";
import { gameCategories } from "../constants";

export interface IGameFilters {
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
}

export interface IGameFiltersQuery
  extends Omit<IGameFilters, "selected" | "excluded"> {
  selectedGenres?: number[];
  selectedModes?: number[];
  selectedPlatforms?: number[];
  selectedThemes?: number[];
  selectedKeywords?: number[];
  excludedGenres?: number[];
  excludedModes?: number[];
  excludedPlatforms?: number[];
  excludedThemes?: number[];
  excludedKeywords?: number[];
}
