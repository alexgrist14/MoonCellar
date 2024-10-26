import { FC, useCallback, useEffect } from "react";
import styles from "./HomePage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { IGDBApi } from "../../shared/api";
import { WheelContainer } from "../../widgets/wheel";
import { getSegments } from "../../shared/utils/getSegments";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useSelectedStore } from "../../shared/store/selected.store";
import { useExcludedStore } from "../../shared/store/excluded.store";
import { useStatesStore } from "../../shared/store/states.store";
import { useCommonStore } from "../../shared/store/common.store";

export const HomePage: FC = () => {
  const {
    isRoyal,
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystems,
    searchQuery,
    royalGames,
    setGames,
  } = useSelectedStore();

  const { excludedGameModes, excludedGenres, excludedSystems } =
    useExcludedStore();
  const { isLoading, setSegments, setStarted, setFinished, setLoading } =
    useStatesStore();
  const { setWinner } = useCommonStore();

  const getIGDBGames = useCallback(() => {
    if (isRoyal) return;

    IGDBApi.getGames({
      selected: {
        genres: selectedGenres?.map((genre) => genre._id),
        platforms: selectedSystems?.map((system) => system._id),
        modes: selectedGameModes?.map((mode) => mode._id),
      },
      excluded: {
        genres: excludedGenres?.map((genre) => genre._id),
        platforms: excludedSystems?.map((system) => system._id),
        modes: excludedGameModes?.map((mode) => mode._id),
      },
      take: 16,
      rating: selectedRating,
      search: searchQuery,
      isRandom: true,
    }).then((response) => {
      if (!!response.data.results.length) {
        const games = response.data.results.map((game) => ({
          _id: game._id,
          id: game.id,
          image: !!game.cover[0] ? "https:" + game.cover[0].url : "",
          name: game.name,
          platforms: game.platforms?.map((platform) => platform._id) || [],
          url: game?.url || "",
        }));

        setGames(games);
        setSegments(getSegments(games, 16));

        setStarted(true);
        setLoading(false);
        setWinner(undefined);
      } else {
        setLoading(false);
        setFinished(true);
        setWinner(undefined);
      }
    });
  }, [
    setLoading,
    setSegments,
    setStarted,
    setWinner,
    isRoyal,
    searchQuery,
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystems,
    setFinished,
    setGames,
    excludedGenres,
    excludedSystems,
    excludedGameModes,
  ]);

  useEffect(() => {
    setWinner(undefined);
    setFinished(true);
    setStarted(false);
    setSegments([]);
  }, [isRoyal]);

  useEffect(() => {
    console.log(isLoading, isRoyal);
    if (isLoading && !isRoyal) {
      getIGDBGames();
    }
  }, [isLoading, getIGDBGames, isRoyal]);

  useEffect(() => {
    isRoyal &&
      !!royalGames &&
      setSegments(royalGames.map((game, i) => game.id + "_" + i));
  }, [isRoyal, royalGames, setSegments]);

  return (
    <div className={styles.page}>
      <ExpandMenu id="consoles">
        <ConsolesList />
      </ExpandMenu>
      <WheelContainer />
      <ExpandMenu position="right"></ExpandMenu>
    </div>
  );
};
