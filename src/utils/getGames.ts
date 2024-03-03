import { getGameList } from "@retroachievements/api";
import { authorization } from "./authorization";
import { store } from "../store";
import { IGame } from "../interfaces/game";
import { setGames } from "../store/selectedSlice";
import { setLoading } from "../store/statesSlice";

export const fetchGameList = async () => {
  const { selectedSystemsRA, games } = store.getState().selected;

  if (!!selectedSystemsRA?.length) {
    const filteredGames =
      games?.filter((game) =>
        selectedSystemsRA?.some(
          (system) =>
            !!game.platforms?.length && system.id === game.platforms[0]
        )
      ) || [];

    const result: IGame[][] = [];
    const queries: Promise<IGame[] | void>[] = [];

    selectedSystemsRA.forEach((system) => {
      if (filteredGames.some((game) => game.platforms.includes(system.id))) {
        return store.dispatch(setGames(filteredGames));
      }

      queries.push(
        getGameList(authorization, {
          consoleId: system.id,
          shouldOnlyRetrieveGamesWithAchievements: false,
        }).then((response) => {
          result.push(
            response
              .map((game) => ({
                id: game.id,
                name: game.title,
                platforms: [game.consoleId],
                achievements: game.numAchievements,
                url: `https://retroachievements.org/game/${game.id}`,
                image: `https://retroachievements.org/${game.imageIcon}`,
              }))
              .filter((game) => !game.name.includes("~"))
              .filter((game) => !game.name.includes("Subset"))
          );

          store.dispatch(
            setGames(([] as IGame[]).concat(filteredGames, result.flat()))
          );
        })
      );
    });

    Promise.all(queries).then(() => store.dispatch(setLoading(false)));
  } else {
    store.dispatch(setLoading(false));
  }
};
