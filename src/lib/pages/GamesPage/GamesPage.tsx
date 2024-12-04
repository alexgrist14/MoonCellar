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
import { useDebouncedCallback } from "use-debounce";
import { useGamesFiltersStore } from "../../shared/store/filters.store";
import { Loader } from "../../shared/ui/Loader";
import classNames from "classnames";

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
    searchCompany,
    selectedCategories,
    selectedYears,
    selectedThemes,
    excludedThemes,
    selectedVotes,
  } = useGamesFiltersStore();
  const { isLoading, setLoading, isRoyal } = useStatesStore();
  const {
    setGenres,
    setGameModes,
    setSystems,
    isMobile,
    setExpanded,
    setThemes,
  } = useCommonStore();

  const step = useMemo(() => (isMobile ? 34 : 35), [isMobile]);

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [take, setTake] = useState(step);
  const [total, setTotal] = useState(0);

  const debouncedGamesFetch = useDebouncedCallback(() => {
    setLoading(true);
    IGDBApi.getGames({
      search: searchQuery,
      company: searchCompany,
      categories: selectedCategories,
      years: selectedYears,
      excluded: {
        genres: excludedGenres?.map((item) => item._id),
        modes: excludedGameModes?.map((item) => item._id),
        platforms: excludedSystems?.map((item) => item._id),
        themes: excludedThemes?.map((item) => item._id),
      },
      selected: {
        genres: selectedGenres?.map((item) => item._id),
        modes: selectedGameModes?.map((item) => item._id),
        platforms: selectedSystems?.map((item) => item._id),
        themes: selectedThemes?.map((item) => item._id),
      },
      page: 1,
      take: take + (!isMobile ? Math.ceil(take / step) - 1 : 0),
      rating: selectedRating,
      votes: selectedVotes,
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
    IGDBApi.getThemes().then((response) => setThemes(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems, setThemes]);

  useEffect(() => {
    debouncedGamesFetch();
  }, [debouncedGamesFetch, take]);

  return (
    <div className={styles.page}>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters callback={() => debouncedGamesFetch()} />
      </ExpandMenu>
      {isLoading && !games.length ? (
        <Loader type="pacman" />
      ) : (
        <div
          className={classNames(styles.page__games, {
            [styles.page__games_loading]: isLoading,
          })}
        >
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
