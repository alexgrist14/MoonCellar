import mongoose from "mongoose";
import { IGetGamesRequest } from "./zod/schemas/games.schema";

const avgIgnoringNulls = (input: unknown[]) => ({
  $avg: {
    $filter: {
      input,
      as: "value",
      cond: { $ne: ["$$value", null] },
    },
  },
});

// averageRating is on a 1-10 scale, igdb.total_rating and hltb.reviewScore
// are on a 0-100 scale; normalize before combining.
export const combinedRatingExpr = avgIgnoringNulls([
  "$igdb.total_rating",
  "$hltb.reviewScore",
  { $multiply: ["$averageRating", 10] },
]);

export const combinedRatingsCountExpr = avgIgnoringNulls([
  "$igdb.total_rating_count",
  "$ratingsCount",
]);

const startOfYear = (year: number) => new Date(year, 0, 1).getTime() / 1000;

const buildYearsFilter = (years: IGetGamesRequest["years"]) => {
  if (!years) return [];

  const [start, end] = years.length === 1 ? [years[0], years[0]] : years;

  const range: Record<string, number> = {};
  if (start !== null) range.$gte = startOfYear(+start);
  if (end !== null) range.$lt = startOfYear(+end + 1);

  return Object.keys(range).length ? [{ first_release: range }] : [];
};

const toValuesArray = (values: string[] | string | null | undefined) =>
  Array.isArray(values) ? values : values ? [values] : [];

const buildMultiSelectConditions = (
  field: string,
  selectedValues: string[] | string | null | undefined,
  excludedValues: string[] | string | null | undefined,
  matchMode: "any" | "all"
) => [
  ...(toValuesArray(selectedValues).length
    ? [
        {
          [field]:
            matchMode === "any"
              ? { $in: toValuesArray(selectedValues) }
              : { $all: toValuesArray(selectedValues) },
        },
      ]
    : []),
  ...(toValuesArray(excludedValues).length
    ? [{ [field]: { $nin: toValuesArray(excludedValues) } }]
    : []),
];

const buildAgeRatingElemMatch = (combo: string) => {
  const [organization, rating] = combo.split(" | ");
  return { ageRatings: { $elemMatch: { organization, rating } } };
};

const buildAgeRatingConditions = (
  selectedValues: string[] | string | null | undefined,
  excludedValues: string[] | string | null | undefined,
  matchMode: "any" | "all"
) => {
  const selectedCombos = toValuesArray(selectedValues);
  const excludedCombos = toValuesArray(excludedValues);

  return [
    ...(selectedCombos.length
      ? matchMode === "any"
        ? [{ $or: selectedCombos.map(buildAgeRatingElemMatch) }]
        : selectedCombos.map(buildAgeRatingElemMatch)
      : []),
    ...(excludedCombos.length
      ? [{ $nor: excludedCombos.map(buildAgeRatingElemMatch) }]
      : []),
  ];
};

export const gamesFilters = (
  filters: IGetGamesRequest,
  searchedIds?: mongoose.Types.ObjectId[]
) => {
  const {
    isOnlyWithAchievements,
    mode,
    years,
    excluded,
    selected,
    excludeGames,
    rating,
    votes,
  } = filters;

  const modeFor = (field: keyof NonNullable<IGetGamesRequest["mode"]>) =>
    mode?.[field] === "all" ? "all" : "any";

  const conditions = [
        ...(isOnlyWithAchievements === true
          ? [
              {
                retroachievements: {
                  $exists: true,
                  $type: "array",
                  $ne: [],
                },
              },
            ]
          : []),
        ...(!!searchedIds
          ? [
              {
                _id: { $in: searchedIds },
              },
            ]
          : []),
        ...(!!selected?.types?.length
          ? [
              {
                type:
                  modeFor("types") === "any"
                    ? {
                        $in: Array.isArray(selected.types)
                          ? selected.types
                          : [selected.types],
                      }
                    : {
                        $all: Array.isArray(selected.types)
                          ? selected.types
                          : [selected.types],
                      },
              },
            ]
          : []),
        ...(!!excluded?.types?.length
          ? [
              {
                type: {
                  $nin: Array.isArray(excluded.types)
                    ? excluded.types
                    : [excluded.types],
                },
              },
            ]
          : []),
        ...buildYearsFilter(years),
        ...(!!selected?.companies?.length
          ? [
              {
                "companies.name":
                  modeFor("companies") === "any"
                    ? {
                        $in: Array.isArray(selected.companies)
                          ? selected.companies
                          : [selected.companies],
                      }
                    : {
                        $all: Array.isArray(selected.companies)
                          ? selected.companies
                          : [selected.companies],
                      },
              },
            ]
          : []),
        ...(!!excluded?.companies?.length
          ? [
              {
                "companies.name": {
                  $nin: Array.isArray(excluded.companies)
                    ? excluded.companies
                    : [excluded.companies],
                },
              },
            ]
          : []),
        ...(rating !== undefined
          ? [{ $expr: { $gte: [combinedRatingExpr, +rating] } }]
          : []),
        ...(votes !== undefined
          ? [{ $expr: { $gte: [combinedRatingsCountExpr, +votes] } }]
          : []),
        ...(!!selected?.keywords?.length
          ? [
              {
                keywords:
                  modeFor("keywords") === "any"
                    ? {
                        $in: Array.isArray(selected?.keywords)
                          ? selected?.keywords
                          : [selected?.keywords],
                      }
                    : {
                        $all: Array.isArray(selected?.keywords)
                          ? selected?.keywords
                          : [selected?.keywords],
                      },
              },
            ]
          : []),
        ...(!!selected?.themes?.length
          ? [
              {
                themes:
                  modeFor("themes") === "any"
                    ? {
                        $in: Array.isArray(selected.themes)
                          ? selected.themes
                          : [selected.themes],
                      }
                    : {
                        $all: Array.isArray(selected.themes)
                          ? selected.themes
                          : [selected.themes],
                      },
              },
            ]
          : []),
        ...(!!excluded?.themes?.length
          ? [
              {
                themes: {
                  $nin: Array.isArray(excluded.themes)
                    ? excluded.themes
                    : [excluded.themes],
                },
              },
            ]
          : []),
        ...(!!selected?.franchises?.length
          ? [
              {
                franchises:
                  modeFor("franchises") === "any"
                    ? {
                        $in: Array.isArray(selected.franchises)
                          ? selected.franchises
                          : [selected.franchises],
                      }
                    : {
                        $all: Array.isArray(selected.franchises)
                          ? selected.franchises
                          : [selected.franchises],
                      },
              },
            ]
          : []),
        ...(!!excluded?.franchises?.length
          ? [
              {
                franchises: {
                  $nin: Array.isArray(excluded.franchises)
                    ? excluded.franchises
                    : [excluded.franchises],
                },
              },
            ]
          : []),
        ...(!!selected?.genres?.length
          ? [
              {
                genres:
                  modeFor("genres") === "any"
                    ? {
                        $in: Array.isArray(selected.genres)
                          ? selected.genres
                          : [selected.genres],
                      }
                    : {
                        $all: Array.isArray(selected.genres)
                          ? selected.genres.map((genre) => genre)
                          : [selected.genres],
                      },
              },
            ]
          : []),
        ...(!!excluded?.genres?.length
          ? [
              {
                genres: {
                  $nin: Array.isArray(excluded.genres)
                    ? excluded.genres
                    : [excluded.genres],
                },
              },
            ]
          : []),
        ...(!!selected?.platforms?.length
          ? [
              {
                platformIds:
                  modeFor("platforms") === "any"
                    ? {
                        $in: Array.isArray(selected.platforms)
                          ? selected.platforms.map(
                              (platform) =>
                                new mongoose.Types.ObjectId(platform)
                            )
                          : [new mongoose.Types.ObjectId(selected.platforms)],
                      }
                    : {
                        $all: Array.isArray(selected.platforms)
                          ? selected.platforms.map(
                              (platform) =>
                                new mongoose.Types.ObjectId(platform)
                            )
                          : [new mongoose.Types.ObjectId(selected.platforms)],
                      },
              },
            ]
          : []),
        ...(!!excluded?.platforms?.length
          ? [
              {
                platformIds: {
                  $nin: Array.isArray(excluded.platforms)
                    ? excluded.platforms.map(
                        (platform) => new mongoose.Types.ObjectId(platform)
                      )
                    : [new mongoose.Types.ObjectId(excluded.platforms)],
                },
              },
            ]
          : []),
        ...(!!selected?.modes?.length
          ? [
              {
                modes:
                  modeFor("modes") === "any"
                    ? {
                        $in: Array.isArray(selected.modes)
                          ? selected.modes
                          : [selected.modes],
                      }
                    : {
                        $all: Array.isArray(selected.modes)
                          ? selected.modes
                          : [selected.modes],
                      },
              },
            ]
          : []),
        ...(!!excluded?.modes?.length
          ? [
              {
                modes: {
                  $nin: Array.isArray(excluded.modes)
                    ? excluded.modes
                    : [excluded.modes],
                },
              },
            ]
          : []),
        ...buildMultiSelectConditions(
          "game_engines",
          selected?.game_engines,
          excluded?.game_engines,
          modeFor("game_engines")
        ),
        ...buildMultiSelectConditions(
          "player_perspectives",
          selected?.player_perspectives,
          excluded?.player_perspectives,
          modeFor("player_perspectives")
        ),
        ...buildMultiSelectConditions(
          "languages",
          selected?.languages,
          excluded?.languages,
          modeFor("languages")
        ),
        ...buildMultiSelectConditions(
          "status",
          selected?.status,
          excluded?.status,
          modeFor("status")
        ),
        ...buildAgeRatingConditions(
          selected?.ageRatings,
          excluded?.ageRatings,
          modeFor("ageRatings")
        ),
        ...(!!excludeGames?.length
          ? [
              {
                _id: {
                  $nin: excludeGames.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            ]
          : []),
  ];

  return {
    $match: conditions.length ? { $and: conditions } : {},
  };
};
