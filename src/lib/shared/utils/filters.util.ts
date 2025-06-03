import queryString from "query-string";
import { IGameFilters, IGameFiltersQuery } from "../types/filters.type";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const parseQueryFilters = (pathWithQuery: string): IGameFilters => {
  const { query } = queryString.parseUrl(pathWithQuery, {
    arrayFormat: "bracket",
    parseBooleans: true,
    parseNumbers: true,
  });

  const filters = query as IGameFiltersQuery;

  return {
    search: filters?.search,
    company: filters?.company,
    categories: filters?.categories,
    years: filters?.years,
    isOnlyWithAchievements: filters?.isOnlyWithAchievements,
    selected: {
      genres: filters?.selectedGenres,
      modes: filters?.selectedModes,
      platforms: filters?.selectedPlatforms,
      themes: filters?.selectedThemes,
      keywords: filters?.selectedKeywords,
    },
    excluded: {
      genres: filters?.excludedGenres,
      modes: filters?.excludedModes,
      platforms: filters?.excludedPlatforms,
      themes: filters?.excludedThemes,
      keywords: filters?.excludedKeywords,
    },
    rating: filters?.rating,
    votes: filters?.votes,
  };
};

export const getFiltersForQuery = (filters: IGameFilters) => {
  return queryString.stringify(
    {
      ...filters,
      selected: undefined,
      excluded: undefined,
      rating: filters.rating || undefined,
      votes: filters.votes || undefined,
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
    },
    {
      arrayFormat: "bracket",
    }
  );
};

export const pushFiltersToQuery = (
  filters: IGameFilters,
  router: AppRouterInstance,
  pathname: string
) => {
  const { push } = router;

  push(`${pathname}?${getFiltersForQuery(filters)}`);
};
