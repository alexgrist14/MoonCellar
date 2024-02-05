import { IGDBAgent } from "../../api";

export const getGames = ({
  limit,
  platforms,
  total,
  rating,
  genres,
}: {
  limit: number;
  platforms?: number[];
  total: number;
  rating?: number;
  genres?: number[];
}) => {
  return IGDBAgent<any[]>("https://api.igdb.com/v4/games", {
    fields:
      "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
    limit: limit,
    offset: (Math.random() * (total - limit)) ^ 0,
    where: `parent_game = null${
      !!platforms?.length ? ` & platforms = (${platforms.join(", ")})` : ""
    }${!!rating ? ` & total_rating >= ${rating}` : ""}${
      !!genres?.length ? ` & genres = (${genres.join(", ")})` : ""
    }`,
  });
};

export const getGamesCount = (
  platforms?: number[],
  rating?: number,
  genres?: number[]
) => {
  return IGDBAgent<{ count: number }>("https://api.igdb.com/v4/games/count", {
    where: `parent_game = null${
      !!platforms?.length ? ` & platforms = (${platforms.join(", ")})` : ""
    }${!!rating ? ` & total_rating >= ${rating}` : ""}${
      !!genres?.length ? ` & genres = (${genres.join(", ")})` : ""
    }`,
  });
};
