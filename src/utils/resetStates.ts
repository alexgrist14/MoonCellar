import { store } from "../store";
import { setGames, setWinner } from "../store/commonSlice";
import { setFinished, setSegments, setStarted } from "../store/statesSlice";

export const resetStates = () => {
  store.dispatch(setSegments(Array(16).fill("")));
  store.dispatch(setWinner(undefined));
  store.dispatch(setFinished(false));
  store.dispatch(setStarted(false));
  store.dispatch(setGames([]));
};
