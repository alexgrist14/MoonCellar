import { IGDBAgent } from "../../api";
import { store } from "../../store";
import { setWinner } from "../../store/commonSlice";
import { setGames } from "../../store/selectedSlice";
import { setLoading, setSegments, setStarted } from "../../store/statesSlice";
import { getSegments } from "../getSegments";
import { shuffle } from "../shuffle";
import { getCovers } from "./getCovers";

export const getGames = () => {
  const limit = 16;

  const {
    selectedGameModes,
    selectedSystemsIGDB,
    selectedRating,
    selectedGenres,
  } = store.getState().selected;
  const { excludedGenres, excludedGameModes, excludedSystems } =
    store.getState().excluded;

  const data = {
    where: `parent_game = null${
      !!selectedSystemsIGDB?.length
        ? ` & platforms = (${selectedSystemsIGDB
            .map((platform) => platform.id)
            .join(", ")})`
        : ""
    }${!!selectedRating ? ` & total_rating >= ${selectedRating}` : ""}${
      !!selectedGenres?.length
        ? ` & genres = (${selectedGenres.map((genre) => genre.id).join(", ")})`
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
    }${
      !!excludedGameModes?.length
        ? ` & game_modes != (${excludedGameModes
            .map((mode) => mode.id)
            .join(", ")})`
        : ""
    }${
      !!excludedSystems?.length
        ? ` & platforms != (${excludedSystems
            .map((platform) => platform.id)
            .join(", ")})`
        : ""
    }`,
  };

  const extendedData = (total: number) => ({
    ...data,
    fields:
      "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
    limit: limit,
    offset: (Math.random() * (total <= limit ? 0 : total - limit)) ^ 0,
  });

  IGDBAgent<{ count: number }>(
    "https://api.igdb.com/v4/games/count",
    data
  ).then((response) => {
    if (!!response.data?.count) {
      IGDBAgent<any[]>(
        "https://api.igdb.com/v4/games",
        extendedData(response.data.count)
      ).then((response) => {
        !!response.data?.length
          ? getCovers(response.data.map((game) => game.id)).then(
              (responseCovers) => {
                const games = shuffle(
                  response.data.map((game) => ({
                    name: game.name,
                    id: game.id,
                    url: game.url,
                    platforms: game.platforms,
                    image: !!responseCovers.data.find(
                      (cover) => cover.id === game.cover
                    )?.url
                      ? "https:" +
                        responseCovers.data.find(
                          (cover) => cover.id === game.cover
                        )?.url
                      : "",
                  }))
                );

                store.dispatch(setGames(games));
                store.dispatch(setSegments(getSegments(games, limit)));
                store.dispatch(setLoading(false));
                store.dispatch(setStarted(true));
                store.dispatch(setWinner(undefined));
              }
            )
          : store.dispatch(setLoading(false));
      });
    } else {
      store.dispatch(setGames([]));
      store.dispatch(setLoading(false));
    }
  });
};
