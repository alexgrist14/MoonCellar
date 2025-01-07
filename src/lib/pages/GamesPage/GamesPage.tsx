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
import { screenGt, screenLg, screenMd, screenSm } from "../../shared/constants";
import { useRouter } from "next/router";
import { parseQueryFilters } from "../../shared/utils/filters.util";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";

export const GamesPage: FC = () => {
  const router = useRouter();
  const { asPath, query } = router;

  const { isLoading, setLoading, isRoyal, isMobile } = useStatesStore();
  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(80);

  const debouncedGamesFetch = useDebouncedCallback(() => {
    setLoading(true);

    const filters = parseQueryFilters(asPath);
    const page = Number(query.page || 1);

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
    if (window.innerWidth >= screenGt) return setTake(42);
    if (window.innerWidth >= screenLg) return setTake(35);
    if (window.innerWidth >= screenMd) return setTake(28);
    if (window.innerWidth >= screenSm) return setTake(21);

    return setTake(14);
  });

  return (
    <>
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters callback={() => debouncedGamesFetch()} />
      </ExpandMenu>
      <Pagination take={take} total={total} isFixed />
      <WrapperTemplate
        contentStyle={{
          padding: isMobile ? "10px" : "20px",
          minHeight: "calc(100vh - 155px)",
        }}
      >
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
      </WrapperTemplate>
    </>
  );
};
