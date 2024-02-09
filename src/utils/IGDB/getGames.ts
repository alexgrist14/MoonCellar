import { IGDBAgent } from "../../api";
import { IIGDBGenre, IIGDBPlatform } from "../../interfaces";
import { store } from "../../store";

export const getGames = ({
  limit,
  platforms,
  total,
  rating,
  genres,
}: {
  limit: number;
  platforms?: IIGDBPlatform[];
  total: number;
  rating?: number;
  genres?: IIGDBGenre[];
}) => {
  const { selectedGameModes } = store.getState().selected;
  const { excludedGenres } = store.getState().excluded;

  return IGDBAgent<any[]>("https://api.igdb.com/v4/games", {
    fields:
      "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
    limit: limit,
    offset: (Math.random() * (total > limit ? total - limit : total)) ^ 0,
    where: `parent_game = null${
      !!platforms?.length
        ? ` & platforms = (${platforms
            .map((platform) => platform.id)
            .join(", ")})`
        : ""
    }${!!rating ? ` & total_rating >= ${rating}` : ""}${
      !!genres?.length
        ? ` & genres = (${genres.map((genre) => genre.id).join(", ")})`
        : ""
    }${
      !!selectedGameModes?.length
        ? ` & game_modes = (${selectedGameModes
            .map((mode) => mode.id)
            .join(", ")})`
        : ""
    }${
      !!excludedGenres?.length
        ? ` & genres != (${excludedGenres.map((genre) => genre.id).join(", ")})`
        : ""
    }`,
  });
};

export const getGamesCount = (
  platforms?: IIGDBPlatform[],
  rating?: number,
  genres?: IIGDBGenre[]
) => {
  const { selectedGameModes } = store.getState().selected;
  const { excludedGenres } = store.getState().excluded;

  return IGDBAgent<{ count: number }>("https://api.igdb.com/v4/games/count", {
    where: `parent_game = null${
      !!platforms?.length
        ? ` & platforms = (${platforms
            .map((platform) => platform.id)
            .join(", ")})`
        : ""
    }${!!rating ? ` & total_rating >= ${rating}` : ""}${
      !!genres?.length
        ? ` & genres = (${genres.map((genre) => genre.id).join(", ")})`
        : ""
    }${
      !!selectedGameModes?.length
        ? ` & game_modes = (${selectedGameModes
            .map((mode) => mode.id)
            .join(", ")})`
        : ""
    }${
      !!excludedGenres?.length
        ? ` & genres != (${excludedGenres.map((genre) => genre.id).join(", ")})`
        : ""
    }`,
  });
};
