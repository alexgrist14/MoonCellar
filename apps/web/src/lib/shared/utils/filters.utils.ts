import queryString from "query-string";
import { IGameFiltersQuery } from "@/src/lib/shared/types/filters.type";
import { ICustomListGamesFilters, IGetGamesRequest } from "@mooncellar/schemas";

const STRING_LIST_FILTERS = [
  "Genres",
  "Modes",
  "Platforms",
  "Themes",
  "Keywords",
  "GameTypes",
  "Franchises",
  "Companies",
  "GameEngines",
  "PlayerPerspectives",
  "Languages",
  "Status",
  "AgeRatings",
];

const STRING_QUERY_TYPES = Object.fromEntries([
  ["search", "string"],
  ...STRING_LIST_FILTERS.flatMap((name) => [
    [`selected${name}`, "string[]"],
    [`excluded${name}`, "string[]"],
  ]),
]);

export const parseQueryFilters = (pathWithQuery: string): IGetGamesRequest => {
  const { query } = queryString.parseUrl(pathWithQuery, {
    arrayFormat: "bracket",
    parseBooleans: true,
    parseNumbers: true,
    types: STRING_QUERY_TYPES,
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
    isOnlyWithSteamAchievements: filters?.isOnlyWithSteamAchievements,
    isOnlySteam: filters?.isOnlySteam,
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

const FILTER_QUERY_KEYS = new Set([
  "search",
  "years",
  "isOnlyWithAchievements",
  "isOnlyWithSteamAchievements",
  "isOnlySteam",
  "rating",
  "votes",
  "sortBy",
  "sortOrder",
  "excludeGames",
  "take",
  "page",
  ...STRING_LIST_FILTERS.flatMap((name) => [
    `selected${name}`,
    `excluded${name}`,
    `mode${name}`,
  ]),
]);

export const pushFiltersToQuery = (filters: IGetGamesRequest) => {
  const kept = new URLSearchParams(window.location.search);

  [...kept.keys()].forEach((key) => {
    if (FILTER_QUERY_KEYS.has(key.replace(/\[\]$/, ""))) kept.delete(key);
  });

  const query = [kept.toString(), getFiltersForQuery(filters)]
    .filter(Boolean)
    .join("&");

  window.history.pushState(null, "", `?${query}`);
};

export const hasGameFilters = (filters: IGetGamesRequest) =>
  !!filters.search ||
  !!filters.isOnlyWithAchievements ||
  !!filters.isOnlyWithSteamAchievements ||
  !!filters.isOnlySteam ||
  filters.rating !== undefined ||
  filters.votes !== undefined ||
  !!filters.years?.some((year) => year !== null && year !== undefined) ||
  [filters.selected, filters.excluded].some(
    (group) =>
      !!group &&
      Object.values(group).some((values) =>
        Array.isArray(values) ? values.length > 0 : !!values
      )
  );

export const pickListGameFilters = (
  search: string
): ICustomListGamesFilters | undefined => {
  const parsed = parseQueryFilters(search);

  if (!hasGameFilters(parsed)) return undefined;

  const {
    selected,
    excluded,
    mode,
    years,
    rating,
    votes,
    search: name,
    isOnlyWithAchievements,
    isOnlyWithSteamAchievements,
    isOnlySteam,
  } = parsed;

  return {
    selected,
    excluded,
    mode,
    years,
    rating,
    votes,
    search: name,
    isOnlyWithAchievements,
    isOnlyWithSteamAchievements,
    isOnlySteam,
  };
};
