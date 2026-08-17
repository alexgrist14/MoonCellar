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

  const normalizeYear = (value: unknown): number | null =>
    value === "" || value == null ? null : Number(value);

  return {
    search: filters?.search,
    years: filters?.years
      ? [normalizeYear(filters.years[0]), normalizeYear(filters.years[1])]
      : undefined,
    isOnlyWithAchievements: filters?.isOnlyWithAchievements,
    rating: filters?.rating,
    votes: filters?.votes,
    sortBy: filters?.sortBy,
    sortOrder: filters?.sortOrder,
    selected: {
      genres: filters?.selectedGenres,
      modes: filters?.selectedModes,
      platforms: filters?.selectedPlatforms,
      themes: filters?.selectedThemes,
      keywords: filters?.selectedKeywords,
      types: filters?.selectedGameTypes,
      franchises: filters?.selectedFranchises,
      companies: filters?.selectedCompanies,
      game_engines: filters?.selectedGameEngines,
      player_perspectives: filters?.selectedPlayerPerspectives,
      languages: filters?.selectedLanguages,
      status: filters?.selectedStatus,
      ageRatings: filters?.selectedAgeRatings,
    },
    excluded: {
      genres: filters?.excludedGenres,
      modes: filters?.excludedModes,
      platforms: filters?.excludedPlatforms,
      themes: filters?.excludedThemes,
      keywords: filters?.excludedKeywords,
      types: filters?.excludedGameTypes,
      franchises: filters?.excludedFranchises,
      companies: filters?.excludedCompanies,
      game_engines: filters?.excludedGameEngines,
      player_perspectives: filters?.excludedPlayerPerspectives,
      languages: filters?.excludedLanguages,
      status: filters?.excludedStatus,
      ageRatings: filters?.excludedAgeRatings,
    },
    mode: {
      genres: filters?.modeGenres,
      modes: filters?.modeModes,
      platforms: filters?.modePlatforms,
      themes: filters?.modeThemes,
      keywords: filters?.modeKeywords,
      types: filters?.modeGameTypes,
      franchises: filters?.modeFranchises,
      companies: filters?.modeCompanies,
      game_engines: filters?.modeGameEngines,
      player_perspectives: filters?.modePlayerPerspectives,
      languages: filters?.modeLanguages,
      status: filters?.modeStatus,
      ageRatings: filters?.modeAgeRatings,
    },
  };
};

export const getFiltersForQuery = (filters: IGetGamesRequest) => {
  return queryString.stringify(
    {
      ...filters,
      selected: undefined,
      excluded: undefined,
      mode: undefined,
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
      selectedFranchises: filters.selected?.franchises,
      excludedFranchises: filters.excluded?.franchises,
      selectedCompanies: filters.selected?.companies,
      excludedCompanies: filters.excluded?.companies,
      selectedGameEngines: filters.selected?.game_engines,
      excludedGameEngines: filters.excluded?.game_engines,
      selectedPlayerPerspectives: filters.selected?.player_perspectives,
      excludedPlayerPerspectives: filters.excluded?.player_perspectives,
      selectedLanguages: filters.selected?.languages,
      excludedLanguages: filters.excluded?.languages,
      selectedStatus: filters.selected?.status,
      excludedStatus: filters.excluded?.status,
      selectedAgeRatings: filters.selected?.ageRatings,
      excludedAgeRatings: filters.excluded?.ageRatings,
      modePlatforms: filters.mode?.platforms,
      modeGenres: filters.mode?.genres,
      modeThemes: filters.mode?.themes,
      modeKeywords: filters.mode?.keywords,
      modeModes: filters.mode?.modes,
      modeGameTypes: filters.mode?.types,
      modeFranchises: filters.mode?.franchises,
      modeCompanies: filters.mode?.companies,
      modeGameEngines: filters.mode?.game_engines,
      modePlayerPerspectives: filters.mode?.player_perspectives,
      modeLanguages: filters.mode?.languages,
      modeStatus: filters.mode?.status,
      modeAgeRatings: filters.mode?.ageRatings,
    },
    {
      arrayFormat: "bracket",
    }
  );
};

export const pushFiltersToQuery = (filters: IGetGamesRequest) => {
  window.history.pushState(null, "", `?${getFiltersForQuery(filters)}`);
};
