import {
  getCombinedRating,
  IGameResponse,
  normalizeRating,
} from "@mooncellar/schemas";

export const formatRating = (
  value?: number | null,
  maxScale: number = 10
): string | null => {
  const normalized = normalizeRating(value, maxScale);

  return normalized == null ? null : `${normalized}`;
};

export const getAverageRating = (game: IGameResponse): number | null =>
  getCombinedRating(game);

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
    {
      key: "vndb",
      label: "VNDB",
      value: formatRating(game.vndb?.rating, 100),
      rating: normalizeRating(game.vndb?.rating, 100),
      count: game.vndb?.votecount,
    },
  ];

  return rows.filter(
    (row): row is IGameRatingRow => row.value != null && row.rating != null
  );
};
