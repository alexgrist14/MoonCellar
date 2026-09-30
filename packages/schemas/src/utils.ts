import z from "zod";

export const transformBoolean = () =>
  z
    .union([z.string(), z.boolean()])
    .transform((val) =>
      typeof val === "boolean"
        ? val
        : ["false", "0", "no"].includes(val.toLowerCase())
          ? false
          : Boolean(val)
    )
    .optional();

export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const stripBbcode = (value: string) =>
  value
    .replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/gi, "")
    .replace(/\[url=[^\]]*\]([\s\S]*?)\[\/url\]/gi, "$1")
    .replace(/\[From [^\]]*\]/gi, "")
    .replace(/\[\/?[a-z]+(?:=[^\]]*)?\]/gi, "")
    .trim();

export const normalizeRating = (
  value?: number | null,
  maxScale: number = 10
): number | null => {
  if (value == null) {
    return null;
  }

  return Math.round((value / maxScale) * 100) / 10;
};

export interface IRatedGame {
  averageRating?: number | null;
  igdb?: { total_rating?: number | null } | null;
  hltb?: { reviewScore?: number | null } | null;
}

export const getCombinedRating = (game: IRatedGame): number | null => {
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
