import { FC, useEffect, useRef, useState } from "react";
import styles from "./GamesPage.module.scss";
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
import { setPage } from "../../shared/utils/query";
import { Shadow } from "../../shared/ui/Shadow";
import { useWindowScroll } from "../../shared/hooks/useWindowScroll";
import { ButtonGroup } from "../../shared/ui/Button/ButtonGroup";
import { modal } from "../../shared/ui/Modal";
import { FixedMenu } from "../../shared/ui/FixedMenu";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";

export const GamesPage: FC = () => {
  const router = useRouter();
  const { isReady, asPath, query } = router;

  const gamesRef = useRef<HTMLDivElement>(null);

  const { isLoading, setLoading, isRoyal } = useStatesStore();
  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(80);

  const [isShadowActive, setIsShadowActive] = useState(false);

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
    if (window.innerWidth >= screenGt) return setTake(42);
    if (window.innerWidth >= screenLg) return setTake(35);
    if (window.innerWidth >= screenMd) return setTake(28);
    if (window.innerWidth >= screenSm) return setTake(21);

    return setTake(14);
  });

  useEffect(() => {
    isReady && !query.page && setPage(1, router);
  }, [router, query, isReady]);

  useWindowScroll(() => {
    const height =
      document.body.scrollHeight -
      document.body.scrollTop -
      document.body.clientHeight -
      50;
    const isActive = window.scrollY < height;

    if (isActive !== isShadowActive) {
      setIsShadowActive(isActive);
    }
  });

  return (
    <div className={classNames("container", styles.page)}>
      <FixedMenu
        buttons={[
          {
            title: "Filters",
            callback: () =>
              modal.open(
                <WrapperTemplate isWithScrollBar>
                  <Filters callback={() => debouncedGamesFetch()} />
                </WrapperTemplate>
              ),
          },
        ]}
      />
      <Pagination take={take} total={total} isFixed />
      {isLoading ? (
        <Loader type="pacman" />
      ) : (
        <div
          ref={gamesRef}
          className={classNames(styles.page__games, {
            [styles.page__games_loading]: isLoading,
          })}
        >
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
          <Shadow isActive={isShadowActive} isFixed />
        </div>
      )}
    </div>
  );
};
