import { getGameList } from "@retroachievements/api";
import { authorization } from "./authorization";
import { store } from "../store";
import { setGames } from "../store/commonSlice";
import { IConsole } from "../interfaces/responses";

export const fetchGameList = async (
  system: IConsole,
  withAchievements: boolean
) => {
  const games = store.getState().common.games;
  const gameList: any[] = await getGameList(authorization, {
    consoleId: system.id,
    shouldOnlyRetrieveGamesWithAchievements: withAchievements,
  });

  const gameListWithoutSubsets = gameList
    .map((game) => ({
      id: game.id,
      name: game.title,
      platforms: [game.consoleId],
      url: `https://retroachievements.org/game/${game.id}`,
      image: `https://retroachievements.org/${game.imageIcon}`,
    }))
    .filter((game) => !game.name.includes("~"))
    .filter((game) => !game.name.includes("Subset"));

  store.dispatch(
    setGames([...(!!games?.length ? games : []), ...gameListWithoutSubsets])
  );
};
