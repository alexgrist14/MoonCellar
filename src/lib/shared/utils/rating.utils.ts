import { IGameResponse } from "../lib/schemas/games.schema";

export const normalizeRating = (
  value?: number | null,
  maxScale: number = 10
): number | null => {
  if (value == null) {
    return null;
  }

  return Math.round((value / maxScale) * 100) / 10;
};

export const formatRating = (
  value?: number | null,
  maxScale: number = 10
): string | null => {
  const normalized = normalizeRating(value, maxScale);

  return normalized == null ? null : `${normalized}`;
};

export const getAverageRating = (game: IGameResponse): number | null => {
  const ratings = [
    normalizeRating(game.averageRating),
    normalizeRating(game.igdb?.total_rating, 100),
    normalizeRating(game.hltb?.reviewScore, 100),
  ].filter((rating): rating is number => rating != null);

  if (!ratings.length) {
    return null;
  }

  const average =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  return Math.round(average * 10) / 10;
};

export interface IGameRatingRow {
  key: string;
  label: string;
  value: string;
  rating: number;
  count: number | null | undefined;
}

export const getGameRatingRows = (game: IGameResponse): IGameRatingRow[] => {
  const rows = [
    {
      key: "users",
      label: "Users",
      value: formatRating(game.averageRating),
      rating: normalizeRating(game.averageRating),
      count: game.ratingsCount,
    },
    {
      key: "igdb",
      label: "IGDB",
      value: formatRating(game.igdb?.total_rating, 100),
      rating: normalizeRating(game.igdb?.total_rating, 100),
      count: game.igdb?.total_rating_count,
    },
    {
      key: "hltb",
      label: "HowLongToBeat",
      value: formatRating(game.hltb?.reviewScore, 100),
      rating: normalizeRating(game.hltb?.reviewScore, 100),
      count: undefined,
    },
  ];

  return rows.filter(
    (row): row is IGameRatingRow => row.value != null && row.rating != null
  );
};
