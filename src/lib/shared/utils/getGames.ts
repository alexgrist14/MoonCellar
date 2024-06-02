import { store } from "../../app/store";
import { setWinner } from "../../app/store/slices/commonSlice";
import { setGames } from "../../app/store/slices/selectedSlice";
import {
  setFinished,
  setLoading,
  setSegments,
  setStarted,
} from "../../app/store/slices/statesSlice";
import { API } from "../api";
import { getSegments } from "./getSegments";

export const fetchGameList = async () => {
  const { selectedSystemsRA, isOnlyWithAchievements } =
    store.getState().selected;

  if (!!selectedSystemsRA?.length) {
    const { data: games } = await API.getRandomGames(
      selectedSystemsRA.map((system) => system.id).join(","),
      isOnlyWithAchievements
    );
    const formattedGames = Object.values(games)
      .flat()
      .map((game) => ({
        id: game.id,
        name: game.title,
        platforms: [game.consoleId],
        achievements: game.numAchievements,
        url: `https://retroachievements.org/game/${game.id}`,
        image: `https://retroachievements.org/${game.imageIcon}`,
      }));

    store.dispatch(setGames(formattedGames));
    store.dispatch(setSegments(getSegments(formattedGames, 16)));

    store.dispatch(setStarted(true));
    store.dispatch(setLoading(false));
    store.dispatch(setWinner(undefined));
  } else {
    store.dispatch(setLoading(false));
    store.dispatch(setFinished(true));
  }
};
