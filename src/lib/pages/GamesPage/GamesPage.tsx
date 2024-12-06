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
import { useDebouncedCallback } from "use-debounce";
import { useGamesFiltersStore } from "../../shared/store/filters.store";
import { Loader } from "../../shared/ui/Loader";
import classNames from "classnames";
import { Pagination } from "../../shared/ui/Pagination";
import { useWindowResizeAction } from "../../shared/hooks";
import {
  screenEx,
  screenGt,
  screenLg,
  screenMd,
  screenSm,
  screenXx,
} from "../../shared/constants";

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
  const { setGenres, setGameModes, setSystems, setExpanded, setThemes } =
    useCommonStore();

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(80);

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
      page,
      take,
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
  }, [debouncedGamesFetch, page, take]);

  useWindowResizeAction(() => {
    console.log(window.innerWidth);

    if (window.innerWidth >= screenXx) return setTake(80);
    if (window.innerWidth >= screenEx) return setTake(70);
    if (window.innerWidth >= screenGt) return setTake(60);
    if (window.innerWidth >= screenLg) return setTake(50);
    if (window.innerWidth >= screenMd) return setTake(40);
    if (window.innerWidth >= screenSm) return setTake(30);

    return setTake(20);
  });

  return (
    <div className={styles.page}>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters callback={() => debouncedGamesFetch()} />
      </ExpandMenu>
      <Pagination
        page={page}
        setPage={setPage}
        take={take}
        total={total}
        isFixed
      />

      {isLoading ? (
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
        </div>
      )}
    </div>
  );
};
