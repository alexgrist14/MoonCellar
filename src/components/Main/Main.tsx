import { FC, useCallback, useEffect, useState } from "react";
import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import styles from "./Main.module.scss";
import { getGames, getGamesCount } from "../../utils/IGDB";
import { shuffle } from "../../utils/shuffle";
import { useAppDispatch, useAppSelector } from "../../store";
import { setGames, setWinner } from "../../store/commonSlice";
import { setFinished, setLoading, setStarted } from "../../store/statesSlice";
import { auth } from "../../api";
import { setAuth } from "../../store/authSlice";
import { getCovers } from "../../utils/IGDB/getCovers";
import { fetchGameList } from "../../utils/getGames";

const Main: FC = () => {
  const dispatch = useAppDispatch();

  const { apiType, systemsIGDB, isRoyal, systemsRA, genres } = useAppSelector(
    (state) => state.common
  );

  const { token } = useAppSelector((state) => state.auth);



  //const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    dispatch(setLoading(true));

    getGamesCount(systemsIGDB, selectedRating, genres).then(
      (response) => {
        !!response.data.count
          ? getGames({
              limit: 20,
              platforms: systemsIGDB,
              total: response.data.count,
              rating: selectedRating,
              genres: genres,
            }).then((response) => {
              getCovers(response.data.map((game) => game.id)).then(
                (responseCovers) => {
                  dispatch(
                    setGames(
                      shuffle(
                        response.data.map((game) => ({
                          name: game.name,
                          id: game.id,
                          url: game.url,
                          platforms: game.platforms,
                          image:
                            "https:" +
                              responseCovers.data.find(
                                (cover) => cover.id === game.cover
                              )?.url || "",
                        }))
                      )
                    )
                  );
                  dispatch(setLoading(false));
                }
              );
            })
          : dispatch(setGames([]));
      }
    );
  }, [
    systemsIGDB,
    selectedRating,
    genres,
    dispatch,
    apiType,
    isRoyal,
    token,
  ]);

  useEffect(() => {
    getIGDBGames();
    dispatch(setWinner(undefined));
  }, [systemsIGDB, selectedRating, genres, getIGDBGames, dispatch]);

  useEffect(() => {
    dispatch(setWinner(undefined));
    dispatch(setFinished(false));
    dispatch(setStarted(false));
    dispatch(setGames([]));
  }, [apiType, dispatch, isRoyal]);

  useEffect(() => {
    if (apiType !== "RA") return;

    !!systemsRA?.length && systemsRA.forEach((system) => fetchGameList(system));
  }, [apiType, systemsRA]);

  useEffect(() => {
    auth().then((response) => dispatch(setAuth(response.data.access_token)));
  }, [dispatch]);

  return (
    <div className={styles.App}>
      <ConsolesList
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
      />
      <WheelContainer callback={getIGDBGames} />
    </div>
  );
};

export default Main;
