import { FC, useCallback, useEffect, useState } from "react";
import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import styles from "./Main.module.scss";
import { getGames, getGamesCount } from "../../utils/IGDB";
import { shuffle } from "../../utils/shuffle";
import { useAppDispatch, useAppSelector } from "../../store";
import { setGames, setWinner } from "../../store/commonSlice";
import { setLoading, setSegments, setStarted } from "../../store/statesSlice";
import { auth } from "../../api";
import { setAuth } from "../../store/authSlice";
import { getCovers } from "../../utils/IGDB/getCovers";
import { fetchGameList } from "../../utils/getGames";
import { resetStates } from "../../utils/resetStates";

const Main: FC = () => {
  const dispatch = useAppDispatch();

  const {} = useAppSelector((state) => state.common);

  const {
    apiType,
    selectedSystemsIGDB,
    selectedSystemsRA,
    isRoyal,
    selectedGenres,
    isOnlyWithAchievements,
    selectedRating,
  } = useAppSelector((state) => state.selected);

  const { token } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.states);

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    dispatch(setLoading(true));

    getGamesCount(selectedSystemsIGDB, selectedRating, selectedGenres).then(
      (response) => {
        if (!!response.data.count) {
          getGames({
            limit: 20,
            platforms: selectedSystemsIGDB,
            total: response.data.count,
            rating: selectedRating,
            genres: selectedGenres,
          }).then((response) => {
            console.log(response);
            !!response.data?.length
              ? getCovers(response.data.map((game) => game.id)).then(
                  (responseCovers) => {
                    const games = shuffle(
                      response.data.map((game) => ({
                        name: game.name,
                        id: game.id,
                        url: game.url,
                        platforms: game.platforms,
                        image: !!responseCovers.data.find(
                          (cover) => cover.id === game.cover
                        )?.url
                          ? "https:" +
                            responseCovers.data.find(
                              (cover) => cover.id === game.cover
                            )?.url
                          : "",
                      }))
                    );

                    dispatch(setGames(games));
                    dispatch(
                      setSegments(games.map((game, i) => game.id + "_" + i))
                    );
                    dispatch(setLoading(false));
                    dispatch(setStarted(true));
                    dispatch(setWinner(undefined));
                  }
                )
              : dispatch(setLoading(false));
          });
        } else {
          dispatch(setGames([]));
          dispatch(setLoading(false));
        }
      }
    );
  }, [
    selectedSystemsIGDB,
    selectedRating,
    selectedGenres,
    dispatch,
    apiType,
    isRoyal,
    token,
  ]);

  useEffect(() => {
    isLoading && !isRoyal && apiType === "IGDB" && getIGDBGames();
  }, [isLoading, getIGDBGames, apiType, isRoyal]);

  useEffect(() => {
    resetStates();
  }, [selectedSystemsIGDB, selectedSystemsRA]);

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
