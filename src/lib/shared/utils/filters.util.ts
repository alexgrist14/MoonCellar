import queryString from "query-string";
import { IGameFilters, IGameFiltersQuery } from "../types/filters.type";
import { NextRouter } from "next/router";

export const parseQueryFilters = (asPath: string): IGameFilters => {
  const { query } = queryString.parseUrl(asPath, {
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
    selected: {
      genres: filters?.selectedGenres,
      modes: filters?.selectedModes,
      platforms: filters?.selectedPlatforms,
      themes: filters?.selectedThemes,
    },
    excluded: {
      genres: filters?.excludedGenres,
      modes: filters?.excludedModes,
      platforms: filters?.excludedPlatforms,
      themes: filters?.excludedThemes,
    },
    rating: filters?.rating,
    votes: filters?.votes,
  };
};

export const pushFiltersToQuery = (
  filters: IGameFilters,
  router: NextRouter
) => {
  const { push, pathname } = router;

  push(
    {
      pathname,
      query: queryString.stringify(
        {
          ...filters,
          selected: undefined,
          excluded: undefined,
          rating: filters.rating || undefined,
          votes: filters.votes || undefined,
          years: [
            filters.years?.[0] || undefined,
            filters.years?.[1] || undefined,
          ],
          selectedPlatforms: filters.selected?.platforms,
          excludedPlatforms: filters.excluded?.platforms,
          selectedGenres: filters.selected?.genres,
          excludedGenres: filters.excluded?.genres,
          selectedThemes: filters.selected?.themes,
          excludedThemes: filters.excluded?.themes,
          selectedModes: filters.selected?.modes,
          excludedModes: filters.excluded?.modes,
        },
        {
          arrayFormat: "bracket",
        }
      ),
    },
    undefined,
    { shallow: true }
  );
};
