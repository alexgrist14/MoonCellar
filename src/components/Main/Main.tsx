import { FC, useCallback, useEffect, useState } from "react";
import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import { IGame } from "../../interfaces/responses";
import styles from "./Main.module.scss";
import { IIGDBGame } from "../../interfaces";
import { getGames, getGamesCount } from "../../utils/IGDB";
import { shuffle } from "../../utils/shuffle";
import { useAppDispatch, useAppSelector } from "../../store";
import { setWinner } from "../../store/commonSlice";
import { setLoading } from "../../store/statesSlice";

const Main: FC = () => {
  const dispatch = useAppDispatch();

  const { apiType, systemsIGDB, isRoyal } = useAppSelector(
    (state) => state.common
  );

  const [games, setGames] = useState<IGame[]>([]);
  const [gamesIGDB, setGamesIGDB] = useState<IIGDBGame[]>([]);

  // const [selectedSystems, setSelectedSystems] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);

  const getIGDBGames = useCallback(() => {
    if (apiType !== "IGDB" || isRoyal) return;

    dispatch(setLoading(true));

    getGamesCount(systemsIGDB, selectedRating, selectedGenres).then(
      (response) =>
        !!response.data.count
          ? getGames({
              limit: 20,
              platforms: systemsIGDB,
              total: response.data.count,
              rating: selectedRating,
              genres: selectedGenres,
            }).then((response) => {
              setGamesIGDB(shuffle(response.data));
              dispatch(setLoading(false));
            })
          : setGamesIGDB([])
    );
  }, [systemsIGDB, selectedRating, selectedGenres, dispatch, apiType, isRoyal]);

  useEffect(() => {
    getIGDBGames();
    dispatch(setWinner(undefined));
  }, [systemsIGDB, selectedRating, selectedGenres, getIGDBGames, dispatch]);

  return (
    <div className={styles.App}>
      <ConsolesList
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
        selectedGenres={selectedGenres}
        setSelectedGenres={setSelectedGenres}
        setGames={setGames}
      />
      <WheelContainer
        games={games}
        gamesIGDB={gamesIGDB}
        callback={getIGDBGames}
      />
    </div>
  );
};

export default Main;
