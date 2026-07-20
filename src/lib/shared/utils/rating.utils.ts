import { IGameResponse } from "../lib/schemas/games.schema";

const normalizeRating = (
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

  return normalized == null ? null : `${normalized}/10`;
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

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  return Math.round(average * 10) / 10;
};
