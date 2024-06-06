import { FC, useCallback, useEffect } from "react";
import styles from "./HomePage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { getRoyalGames } from "../../shared/utils/getRoyalGames";
import { getGames } from "../../shared/utils/IGDB";
import { auth } from "../../shared/api";
import { setWinner } from "../../app/store/slices/commonSlice";
import {
  setFinished,
  setSegments,
  setStarted,
} from "../../app/store/slices/statesSlice";
import { setAuth } from "../../app/store/slices/authSlice";
import { WheelContainer } from "../../widgets/wheel";
import { fetchGameList } from "../../shared/utils/getGames";

export const HomePage: FC = () => {
  const dispatch = useAppDispatch();

  const { apiType, selectedSystemsRA, isRoyal } = useAppSelector(
    (state) => state.selected
  );

  const { email, user } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.states);

  const royalGames = getRoyalGames();

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal) return;

    getGames();
  }, [apiType, isRoyal]);

  useEffect(() => {
    auth().then((response) => dispatch(setAuth(response.data.access_token)));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setWinner(undefined));
    dispatch(setFinished(true));
    dispatch(setStarted(false));
    dispatch(setSegments([]));
  }, [apiType, dispatch, isRoyal, selectedSystemsRA]);

  useEffect(() => {
    if (isLoading && !isRoyal) {
      dispatch(setSegments([]));

      apiType === "IGDB" && getIGDBGames();
      apiType === "RA" && fetchGameList();
    }
  }, [isLoading, getIGDBGames, apiType, isRoyal, dispatch]);

  useEffect(() => {
    isRoyal &&
      dispatch(setSegments(royalGames.map((game, i) => game.id + "_" + i)));
  }, [isRoyal, royalGames, dispatch]);

  return (
    <div className={styles.App}>
      <ConsolesList />
      <WheelContainer />
    </div>
  );
};
