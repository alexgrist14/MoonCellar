import { AxiosResponse } from "axios";
import { IGDBAgent } from "../../api";
import { getSegments } from "../getSegments";
import { shuffle } from "../shuffle";
import { getCovers } from "./getCovers";
import { store } from "@/src/lib/app/store";
import { setGames } from "@/src/lib/app/store/slices/selectedSlice";
import {
  setFinished,
  setLoading,
  setSegments,
  setStarted,
} from "@/src/lib/app/store/slices/statesSlice";
import { setWinner } from "@/src/lib/app/store/slices/commonSlice";

export const getGames = () => {
  const {
    selectedGameModes,
    selectedSystemsIGDB,
    selectedRating,
    selectedGenres,
    searchQuery,
  } = store.getState().selected;
  const { excludedGenres, excludedGameModes, excludedSystems } =
    store.getState().excluded;

  const data = {
    ...(!!searchQuery && { search: `"${searchQuery}"` }),
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

  const extendedData = (limit: number, offset: number) => ({
    ...data,
    fields:
      "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
    limit,
    offset,
  });

  IGDBAgent<{ count: number }>(
    "https://api.igdb.com/v4/games/count",
    data
  ).then((response) => {
    if (!!response.data?.count) {
      const queries: Promise<AxiosResponse<any[]>>[] = [];
      const { count } = response.data;
      const limit = 16;
      const parts = 4;

      if (count <= limit) {
        queries.push(
          IGDBAgent<any[]>(
            "https://api.igdb.com/v4/games",
            extendedData(limit, 0)
          )
        );
      } else {
        for (let i = 0; i < parts; i++) {
          const total = Math.floor(count / parts);

          const min = i * total;
          const max = min + (total - parts);

          const offset = Math.floor(Math.random() * (max - min) + min);

          queries.push(
            IGDBAgent<any[]>(
              "https://api.igdb.com/v4/games",
              extendedData(parts, offset)
            )
          );
        }
      }

      Promise.all(queries).then((response) => {
        const data = response.map((res) => res.data).flat();

        if (!!data?.length) {
          getCovers(data.map((game) => game.id)).then((responseCovers) => {
            const games = shuffle(
              data.map((game) => ({
                name: game.name,
                id: game.id,
                url: game.url,
                platforms: game.platforms,
                image: !!responseCovers.data.find(
                  (cover) => cover.id === game.cover
                )?.url
                  ? "https:" +
                    responseCovers.data.find((cover) => cover.id === game.cover)
                      ?.url
                  : "",
              }))
            );

            store.dispatch(setGames(games));
            store.dispatch(setSegments(getSegments(games, limit)));
            store.dispatch(setLoading(false));
            store.dispatch(setStarted(true));
            store.dispatch(setWinner(undefined));
          });
        } else {
          store.dispatch(setLoading(false));
          store.dispatch(setFinished(true));
        }
      });
    } else {
      store.dispatch(setGames([]));
      store.dispatch(setLoading(false));
      store.dispatch(setFinished(true));
    }
  });
};
