import { FC, useEffect, useRef, useState } from "react";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { IGDBApi } from "../../shared/api";
import { useGamesFiltersStore } from "../../shared/store/games-filters.store";
import { useCommonStore } from "../../shared/store/common.store";
import { IGDBGame } from "../../shared/types/igdb";
import { axiosUtils } from "../../shared/utils/axios";
import { GameCard } from "../../shared/ui/GameCard";
import { useStatesStore } from "../../shared/store/states.store";
import { Button } from "../../shared/ui/Button";
import { PulseLoader } from "react-spinners";

export const GamesPage: FC = () => {
  const {
    isRoyal,
    selectedGenres,
    selectedRating,
    selectedSystems,
    selectedGameModes,
    excludedGenres,
    excludedSystems,
    excludedGameModes,
    searchQuery,
  } = useGamesFiltersStore();
  const { isLoading, isPlatformsLoading, setLoading } = useStatesStore();
  const { setGenres, setGameModes, setSystems } = useCommonStore();
  const gamesRef = useRef<HTMLDivElement>(null);

  const [games, setGames] = useState<IGDBGame[]>([]);
  const [take, setTake] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems]);

  useEffect(() => {
    if (!isPlatformsLoading && !isLoading) {
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
        take,
        rating: selectedRating,
      })
        .then((res) => {
          setGames(res.data.results);
          setTotal(res.data.total);
        })
        .catch(axiosUtils.toastError)
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
    }
  }, [
    searchQuery,
    excludedGenres,
    excludedSystems,
    excludedGameModes,
    selectedGenres,
    selectedRating,
    selectedSystems,
    selectedGameModes,
    isPlatformsLoading,
    isLoading,
    take,
    setLoading,
  ]);

  useEffect(() => {
    // ref
  }, [gamesRef]);

  return (
    <div className={styles.page}>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters />
      </ExpandMenu>
      {!!total && (
        <div ref={gamesRef} className={styles.page__games}>
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
          {!!games?.length && take < total && (
            <Button
              className={styles.modal__more}
              onClick={() => setTake(take + take)}
            >
              {isLoading ? <PulseLoader color="#ffffff" /> : "More games"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
