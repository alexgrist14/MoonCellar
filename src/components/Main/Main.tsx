import { FC, useCallback, useEffect } from "react";
import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import styles from "./Main.module.scss";
import { getGames } from "../../utils/IGDB";
import { useAppDispatch, useAppSelector } from "../../store";
import { setGames } from "../../store/commonSlice";
import { setLoading } from "../../store/statesSlice";
import { auth } from "../../api";
import { setAuth } from "../../store/authSlice";
import { fetchGameList } from "../../utils/getGames";

const Main: FC = () => {
  const dispatch = useAppDispatch();

  const { apiType, selectedSystemsRA, isRoyal, isOnlyWithAchievements } =
    useAppSelector((state) => state.selected);

  const { token } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.states);

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

    dispatch(setGames([]));
    !!selectedSystemsRA?.length &&
      selectedSystemsRA.forEach((system) =>
        fetchGameList(system, isOnlyWithAchievements)
      );
  }, [apiType, selectedSystemsRA, isOnlyWithAchievements, dispatch]);

  useEffect(() => {
    auth().then((response) => dispatch(setAuth(response.data.access_token)));
  }, [dispatch]);

  return (
    <div className={styles.App}>
      <ConsolesList />
      <WheelContainer />
    </div>
  );
};

export default Main;
