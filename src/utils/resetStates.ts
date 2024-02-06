import { store } from "../store";
import { setWinner } from "../store/commonSlice";
import { setFinished, setSegments, setStarted } from "../store/statesSlice";

export const resetStates = () => {
  store.dispatch(setWinner(undefined));
  store.dispatch(setFinished(false));
  store.dispatch(setStarted(false));
  store.dispatch(setSegments([]));
};
