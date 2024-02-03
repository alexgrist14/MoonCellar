import { AxiosResponse } from "axios";
import { Dispatch, SetStateAction } from "react";
import { IGDBAgent } from "../../api";

export const getGamesFuckYou = ({
  limit,
  setGames,
  count,
  platforms,
  total,
}: {
  setGames: Dispatch<SetStateAction<any[]>>;
  limit: number;
  count?: number;
  platforms?: number[];
  total: number;
}) => {
  const fetchIGDB = (limit: number, offset?: number) => {
    return IGDBAgent("https://api.igdb.com/v4/games", {
      fields:
        "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
      limit: limit,
      offset: offset || (Math.random() * total) ^ 0,
      where: `parent_game = null${
        !!platforms?.length ? ` & platforms = (${platforms.join(", ")})` : ""
      }`,
    });
  };

  const queries: Promise<AxiosResponse>[] = [];
  const maxRetries = 5;

  let attempt = 0;

  for (let i = 0; i < (count || 1); i++) {
    queries.push(fetchIGDB(limit));
  }

  const hui = async (queries: Promise<AxiosResponse>[]) => {
    const results: any[] = await Promise.allSettled(queries);
    const retryPromises: Promise<AxiosResponse>[] = [];
    const successResults: any[] = [];

    results.forEach((result) =>
      result.status === "rejected"
        ? retryPromises.push(
            fetchIGDB(
              result.reason.config.params.limit,
              result.reason.config.params.offset
            )
          )
        : successResults.push(result)
    );

    // setGames((games) => {
    //   return Array.from(
    //     new Set(
    //       games.concat(...successResults.map((result) => result.value.data))
    //     )
    //   );
    // });
    setGames([].concat(...successResults.map((result) => result.value.data)));

    if (!!retryPromises?.length) {
      attempt++;
      attempt <= maxRetries && hui(retryPromises);
    }
  };

  hui(queries);
};

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
  return IGDBAgent("https://api.igdb.com/v4/games", {
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
  return IGDBAgent("https://api.igdb.com/v4/games/count", {
    where: `parent_game = null${
      !!platforms?.length ? ` & platforms = (${platforms.join(", ")})` : ""
    }${!!rating ? ` & total_rating >= ${rating}` : ""}${
      !!genres?.length ? ` & genres = (${genres.join(", ")})` : ""
    }`,
  });
};
