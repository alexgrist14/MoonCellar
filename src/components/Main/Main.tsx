import { FC, useCallback, useEffect } from "react";
import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import styles from "./Main.module.scss";
import { getGames } from "../../utils/IGDB";
import { useAppDispatch, useAppSelector } from "../../store";
import { setWinner } from "../../store/commonSlice";
import {
  setFinished,
  setLoading,
  setSegments,
  setStarted,
} from "../../store/statesSlice";
import { auth } from "../../api";
import { setAuth } from "../../store/authSlice";
import { fetchGameList } from "../../utils/getGames";
import Footer from "../Footer/Footer";

const Main: FC = () => {
  const dispatch = useAppDispatch();

  const { apiType, selectedSystemsRA, isRoyal, royalGamesRA, royalGamesIGDB } =
    useAppSelector((state) => state.selected);

  const { token } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.states);

  const royalGames = apiType === "RA" ? royalGamesRA : royalGamesIGDB;

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    dispatch(setLoading(true));

    getGames();
  }, [dispatch, apiType, isRoyal, token]);

  useEffect(() => {
    isLoading && !isRoyal && apiType === "IGDB" && getIGDBGames();
  }, [isLoading, getIGDBGames, apiType, isRoyal]);

  useEffect(() => {
    if (apiType !== "RA") return;

    dispatch(setLoading(true));
    fetchGameList();
  }, [apiType, selectedSystemsRA, dispatch]);

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
    isRoyal &&
      dispatch(setSegments(royalGames.map((game, i) => game.id + "_" + i)));
  }, [isRoyal, royalGames, dispatch]);

  return (
    <div className={styles.App}>
      <ConsolesList />
      <WheelContainer />
      <Footer/>
    </div>
  );
};

export default Main;
