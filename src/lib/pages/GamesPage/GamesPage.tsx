import { FC, useEffect, useState } from "react";
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
import { useRouter } from "next/router";
import { parseQueryFilters } from "../../shared/utils/filters.util";
import { setPage } from "../../shared/utils/query";

export const GamesPage: FC = () => {
  const router = useRouter();
  const { isReady, asPath, query } = router;

  const { isLoading, setLoading, isRoyal } = useStatesStore();
  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(80);

  const debouncedGamesFetch = useDebouncedCallback(() => {
    if (!query.page) return;

    setLoading(true);

    const filters = parseQueryFilters(asPath);
    const page = Number(query.page);

    !!page &&
      IGDBApi.getGames({
        ...filters,
        page,
        take,
      })
        .then((res) => {
          setGames(res.data.results);
          setTotal(res.data.total);
        })
        .catch(axiosUtils.toastError)
        .finally(() => {
          setLoading(false);
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
  }, [debouncedGamesFetch, take, asPath, query]);

  useWindowResizeAction(() => {
    if (window.innerWidth >= screenXx) return setTake(56);
    if (window.innerWidth >= screenEx) return setTake(49);
    if (window.innerWidth >= screenGt) return setTake(42);
    if (window.innerWidth >= screenLg) return setTake(35);
    if (window.innerWidth >= screenMd) return setTake(28);
    if (window.innerWidth >= screenSm) return setTake(21);

    return setTake(14);
  });

  useEffect(() => {
    isReady && !query.page && setPage(1, router);
  }, [router, query, isReady]);

  return (
    <div className={styles.page}>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters callback={() => debouncedGamesFetch()} />
      </ExpandMenu>
      <Pagination take={take} total={total} isFixed />

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
