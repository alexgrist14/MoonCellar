import queryString from "query-string";
import { IGameFiltersQuery } from "../types/filters.type";
import { IGetGamesRequest } from "../lib/schemas/games.schema";

export const parseQueryFilters = (pathWithQuery: string): IGetGamesRequest => {
  const { query } = queryString.parseUrl(pathWithQuery, {
    arrayFormat: "bracket",
    parseBooleans: true,
    parseNumbers: true,
  });

  const filters = query as IGameFiltersQuery;

  return {
    search: filters?.search,
    company: filters?.company,
    years: filters?.years,
    isOnlyWithAchievements: filters?.isOnlyWithAchievements,
    selected: {
      genres: filters?.selectedGenres,
      modes: filters?.selectedModes,
      platforms: filters?.selectedPlatforms,
      themes: filters?.selectedThemes,
      keywords: filters?.selectedKeywords,
      types: filters?.selectedGameTypes,
    },
    excluded: {
      genres: filters?.excludedGenres,
      modes: filters?.excludedModes,
      platforms: filters?.excludedPlatforms,
      themes: filters?.excludedThemes,
      keywords: filters?.excludedKeywords,
      types: filters?.excludedGameTypes,
    },
  };
};

export const getFiltersForQuery = (filters: IGetGamesRequest) => {
  return queryString.stringify(
    {
      ...filters,
      selected: undefined,
      excluded: undefined,
      years: [filters.years?.[0] || undefined, filters.years?.[1] || undefined],
      selectedPlatforms: filters.selected?.platforms,
      excludedPlatforms: filters.excluded?.platforms,
      selectedGenres: filters.selected?.genres,
      excludedGenres: filters.excluded?.genres,
      selectedThemes: filters.selected?.themes,
      excludedThemes: filters.excluded?.themes,
      selectedKeywords: filters.selected?.keywords,
      excludedKeywords: filters.excluded?.keywords,
      selectedModes: filters.selected?.modes,
      excludedModes: filters.excluded?.modes,
      selectedGameTypes: filters.selected?.types,
      excludedGameTypes: filters.excluded?.types,
    },
    {
      arrayFormat: "bracket",
    }
  );
};

export const pushFiltersToQuery = (filters: IGetGamesRequest) => {
  window.history.pushState(null, "", `?${getFiltersForQuery(filters)}`);
};
