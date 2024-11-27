import { FC, useEffect, useMemo, useState } from "react";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { IGDBApi } from "../../shared/api";
import { useCommonStore } from "../../shared/store/common.store";
import { IGDBGameMinimal } from "../../shared/types/igdb";
import { axiosUtils } from "../../shared/utils/axios";
import { GameCard } from "../../shared/ui/GameCard";
import { useStatesStore } from "../../shared/store/states.store";
import { Button } from "../../shared/ui/Button";
import { PacmanLoader, PulseLoader } from "react-spinners";
import { useDebouncedCallback } from "use-debounce";
import { useGamesFiltersStore } from "../../shared/store/filters.store";
import { Loader } from "../../shared/ui/Loader";

export const GamesPage: FC = () => {
  const {
    selectedGenres,
    selectedRating,
    selectedSystems,
    selectedGameModes,
    excludedGenres,
    excludedSystems,
    excludedGameModes,
    searchQuery,
  } = useGamesFiltersStore();
  const { isLoading, setLoading, isRoyal } = useStatesStore();
  const { setGenres, setGameModes, setSystems, isMobile, setExpanded } =
    useCommonStore();

  const step = useMemo(() => (isMobile ? 34 : 35), [isMobile]);

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [take, setTake] = useState(step);
  const [total, setTotal] = useState(0);

  const debouncedGamesFetch = useDebouncedCallback(() => {
    setLoading(true);

    IGDBApi.getGames({
      search: searchQuery,
      excluded: {
        genres: excludedGenres?.map((item) => item._id),
        modes: excludedGameModes?.map((item) => item._id),
        platforms: excludedSystems?.map((item) => item._id),
      },
      selected: {
        genres: selectedGenres?.map((item) => item._id),
        modes: selectedGameModes?.map((item) => item._id),
        platforms: selectedSystems?.map((item) => item._id),
      },
      page: 1,
      take: take + (!isMobile ? Math.ceil(take / step) - 1 : 0),
      rating: selectedRating,
    })
      .then((res) => {
        setGames(res.data.results);
        setTotal(res.data.total);
      })
      .catch(axiosUtils.toastError)
      .finally(() => {
        setLoading(false);
        setExpanded("none");
      });
  }, 100);

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems]);

  useEffect(() => {
    debouncedGamesFetch();
  }, [debouncedGamesFetch, take]);

  return (
    <div className={styles.page}>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters callback={() => debouncedGamesFetch()} />
      </ExpandMenu>
      {isLoading && !games.length ? (
        <PacmanLoader color="#ffffff" className={styles.page__loader} />
      ) : (
        <div className={styles.page__games}>
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
          {!!games?.length && take < total && (
            <Button
              className={styles.page__more}
              onClick={() => setTake(take + step)}
            >
              {isLoading ? <Loader /> : "More games"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
