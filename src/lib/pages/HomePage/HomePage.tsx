import { FC, useCallback, useEffect } from "react";
import styles from "./HomePage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { getRoyalGames } from "../../shared/utils/getRoyalGames";
import { IGDBApi, auth } from "../../shared/api";
import { setWinner } from "../../app/store/slices/commonSlice";
import {
  setFinished,
  setLoading,
  setSegments,
  setStarted,
} from "../../app/store/slices/statesSlice";
import { setAuth } from "../../app/store/slices/authSlice";
import { WheelContainer } from "../../widgets/wheel";
import { fetchGameList } from "../../shared/utils/getGames";
import { setGames } from "../../app/store/slices/selectedSlice";
import { getSegments } from "../../shared/utils/getSegments";

export const HomePage: FC = () => {
  const dispatch = useAppDispatch();

  const {
    apiType,
    selectedSystemsRA,
    isRoyal,
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystemsIGDB,
    searchQuery,
  } = useAppSelector((state) => state.selected);

  const { token } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.states);

  const royalGames = getRoyalGames();

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    IGDBApi.getGames({
      genres: selectedGenres.map((genre) => genre._id),
      modes: selectedGameModes.map((mode) => mode._id),
      take: 16,
      rating: selectedRating,
      platforms: selectedSystemsIGDB.map((system) => system._id),
      search: searchQuery,
      isRandom: true,
    }).then((response) => {
      const games = response.data.map((game) => ({
        id: game.id,
        image: !!game.cover[0] ? "https:" + game.cover[0].url : "",
        name: game.name,
        platforms: game.platforms.map((platform) => platform._id),
        url: game.url,
      }));

      dispatch(setGames(games));
      dispatch(setSegments(getSegments(games, 16)));

      dispatch(setStarted(true));
      dispatch(setLoading(false));
      dispatch(setWinner(undefined));
    });
  }, [
    apiType,
    isRoyal,
    token,
    dispatch,
    searchQuery,
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystemsIGDB,
  ]);

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
